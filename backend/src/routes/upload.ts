import { Router, Request, Response } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";
import { authenticateToken, AuthRequest } from "../middleware/auth";

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
});

import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

// Sanitize values to remove invisible/control characters that cause "Invalid character in header content" errors
const sanitize = (val: string | undefined): string => {
  if (!val) return "";
  // Trim whitespace and remove invisible/control characters (newlines, carriage returns, etc)
  return val.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, "");
};

// Configure R2/S3
if (
  !process.env.R2_ACCOUNT_ID ||
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !process.env.R2_BUCKET_NAME ||
  !process.env.R2_PUBLIC_URL
) {
  console.warn("Missing required R2 environment variables");
}

const r2AccountId = sanitize(process.env.R2_ACCOUNT_ID);
const r2Endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;

// Custom agent to handle specific SSL issues (EPROTO alert 40)
const httpsAgent = new HttpsAgent({
  keepAlive: true,
  minVersion: "TLSv1.2",
  servername: `${r2AccountId}.r2.cloudflarestorage.com`,
});

const s3 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: sanitize(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: sanitize(process.env.R2_SECRET_ACCESS_KEY),
  },
  requestHandler: new NodeHttpHandler({
    httpsAgent,
    httpAgent: new HttpAgent({ keepAlive: true }),
  }),
});

// Helper to compress video
async function compressVideo(inputBuffer: Buffer): Promise<Buffer> {
  const tempDir = os.tmpdir();
  const uniqueId = uuidv4();
  const inputPath = path.join(tempDir, `input-${uniqueId}.mp4`);
  const outputPath = path.join(tempDir, `output-${uniqueId}.mp4`);

  await fs.promises.writeFile(inputPath, inputBuffer);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-c:v libx264",
        "-crf 28", // Higher CRF = lower quality/size. 23 is default, 28 is decent compression.
        "-preset ultrafast", // Fast compression to avoid timeouts
        "-movflags +faststart",
        "-pix_fmt yuv420p", // Ensure compatibility
      ])
      .save(outputPath)
      .on("end", async () => {
        try {
          const compressed = await fs.promises.readFile(outputPath);
          // Cleanup
          await fs.promises.unlink(inputPath).catch(() => {});
          await fs.promises.unlink(outputPath).catch(() => {});
          console.log(
            `[upload] Video compressed: ${inputBuffer.length} -> ${compressed.length} bytes`
          );
          resolve(compressed);
        } catch (e) {
          reject(e);
        }
      })
      .on("error", async (err: any) => {
        console.error("[upload] FFmpeg error:", err);
        // Cleanup on error
        await fs.promises.unlink(inputPath).catch(() => {});
        await fs.promises.unlink(outputPath).catch(() => {});
        reject(err);
      });
  });
}

router.post(
  "/",
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
      const file = req.file;
      const fileType = req.body.type as string; // "image" or "video"
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate file size based on type
      const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB for images
      const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // 150MB

      if (file.mimetype.startsWith("video/") || fileType === "video") {
        if (file.size > MAX_VIDEO_SIZE) {
          return res.status(413).json({
            error: `Video file is too large. Maximum size is ${
              MAX_VIDEO_SIZE / (1024 * 1024)
            }MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          });
        }
      } else if (file.mimetype.startsWith("image/")) {
        if (file.size > MAX_IMAGE_SIZE) {
          return res.status(413).json({
            error: `Image file is too large. Maximum size is ${
              MAX_IMAGE_SIZE / (1024 * 1024)
            }MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          });
        }
      }

      // Buffer
      const buffer = file.buffer;

      // Generate a unique filename
      const timestamp = Date.now();
      const uniqueId = Math.random().toString(36).substring(2, 15);

      let key: string;
      let contentType: string;
      let body: Buffer;

      if (file.mimetype.startsWith("video/") || fileType === "video") {
        // Handle video upload
        const allowedVideoTypes = [
          "video/mp4",
          "video/webm",
          "video/quicktime",
          "video/x-msvideo",
        ];

        // If mimetype is octet-stream (sometimes happens), trust the extension or just proceed if declared as video
        if (
          file.mimetype !== "application/octet-stream" &&
          !allowedVideoTypes.includes(file.mimetype)
        ) {
          return res.status(400).json({
            error: "Invalid video type. Allowed: MP4, WebM, MOV, AVI",
          });
        }

        // Compress video if it's larger than 5MB
        const COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // 5MB
        let videoBuffer = buffer;

        if (buffer.length > COMPRESSION_THRESHOLD) {
          try {
            console.log(
              `[upload] Compressing video (${buffer.length} bytes)...`
            );
            videoBuffer = await compressVideo(buffer);
          } catch (compressionError: any) {
            console.error(
              "[upload] Video compression failed, using original:",
              compressionError
            );
            // Fallback to original buffer if compression fails
            videoBuffer = buffer;
          }
        }

        const extension = "mp4";
        key = `surf-videos/${userId}/${timestamp}-${uniqueId}.${extension}`;
        contentType = "video/mp4";
        body = videoBuffer;
      } else if (file.mimetype.startsWith("image/")) {
        // Handle image upload - convert to WebP
        const optimizedBuffer = await Sharp(buffer)
          .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85, effort: 6 })
          .toBuffer();

        key = `surf-images/${userId}/${timestamp}-${uniqueId}.webp`;
        contentType = "image/webp";
        body = optimizedBuffer;
      } else {
        return res
          .status(400)
          .json({ error: "File must be an image or video" });
      }

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      });

      console.log(`[upload] Uploading to R2: ${key}`);
      await s3.send(command);
      console.log("[upload] Upload successful");

      // Construct the public URL
      const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

      // Return appropriate field name based on file type
      if (file.mimetype.startsWith("video/") || fileType === "video") {
        return res.json({ videoUrl: fileUrl });
      } else {
        return res.json({ imageUrl: fileUrl });
      }
    } catch (error: any) {
      console.error("[upload] Error uploading file:", error);
      res.status(500).json({
        error: "Failed to upload file",
        details: error.message,
      });
    }
  }
);

export default router;
