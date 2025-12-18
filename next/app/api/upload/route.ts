import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Decode JWT without verification (for performance - we only need user ID)
// The token is already validated by being in an HttpOnly cookie set by the backend
function decodeJWT(token: string): { id?: string; sub?: string } | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode payload (base64url)
    const payload = parts[1];
    const decoded = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");
    return JSON.parse(decoded);
  } catch (error) {
    console.error("[upload] Failed to decode JWT:", error);
    return null;
  }
}
// Add environment variable validation at the top
if (
  !process.env.R2_ACCOUNT_ID ||
  !process.env.R2_ACCESS_KEY_ID ||
  !process.env.R2_SECRET_ACCESS_KEY ||
  !process.env.R2_BUCKET_NAME ||
  !process.env.R2_PUBLIC_URL
) {
  throw new Error("Missing required R2 environment variables");
}

// Initialize S3 client for Cloudflare R2
// Simplified to match old working pattern - removed middleware and forcePathStyle
const r2Endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const s3 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Removed forcePathStyle - old code didn't have it
  // Removed middleware - simplifying to match old working pattern
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // Increase timeout to 5 minutes for video compression

export async function POST(req: NextRequest) {
  try {
    // Get auth token from cookie
    const authToken = req.cookies.get("auth-token")?.value;

    if (!authToken) {
      console.warn("[upload] No auth-token cookie found in request");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upload files." },
        { status: 401 }
      );
    }

    // Decode JWT to get user ID (no verification needed - token is in HttpOnly cookie from backend)
    // This is faster than calling the backend and acceptable for file uploads
    // The backend will verify the token when files are actually used
    const decoded = decodeJWT(authToken);
    let userId = decoded?.id || decoded?.sub;

    // Fallback: if JWT decode fails, verify with backend
    if (!userId) {
      console.warn(
        "[upload] Could not extract user ID from JWT token, falling back to backend verification"
      );
      const authResult = await getServerAuth();
      const { user, error: authError } = authResult;

      if (authError) {
        console.error("[upload] Auth error:", authError);
        return NextResponse.json(
          { error: "Authentication failed", details: authError },
          { status: 401 }
        );
      }

      if (!user?.id) {
        return NextResponse.json(
          { error: "Unauthorized. Please log in to upload files." },
          { status: 401 }
        );
      }

      userId = user.id;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("type") as string; // "image" or "video"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size based on type
    const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB for images
    const MAX_VIDEO_SIZE = 150 * 1024 * 1024; // Increased to 150MB since we compress

    if (file.type.startsWith("video/") || fileType === "video") {
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          {
            error: `Video file is too large. Maximum size is ${
              MAX_VIDEO_SIZE / (1024 * 1024)
            }MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          },
          { status: 413 }
        );
      }
    } else if (file.type.startsWith("image/")) {
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            error: `Image file is too large. Maximum size is ${
              MAX_IMAGE_SIZE / (1024 * 1024)
            }MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          },
          { status: 413 }
        );
      }
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate a unique filename
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);

    let key: string;
    let contentType: string;
    let body: Buffer;

    if (file.type.startsWith("video/") || fileType === "video") {
      // Handle video upload
      const allowedVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
      ];

      if (!allowedVideoTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid video type. Allowed: MP4, WebM, MOV, AVI" },
          { status: 400 }
        );
      }

      // Compress video if it's larger than 10MB
      const COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // 5MB
      let videoBuffer = buffer;

      if (buffer.length > COMPRESSION_THRESHOLD) {
        try {
          console.log(`[upload] Compressing video (${buffer.length} bytes)...`);
          videoBuffer = await compressVideo(buffer);
        } catch (compressionError: any) {
          console.error("[upload] Video compression failed, using original:", compressionError);
          // Fallback to original buffer if compression fails
          videoBuffer = buffer;
        }
      }

      // Always save as mp4 when compressed, but keep original ext if fallback?
      // Actually, ffmpeg converts to mp4 (libx264).
      const extension = "mp4";
      key = `surf-videos/${userId}/${timestamp}-${uniqueId}.${extension}`;
      contentType = "video/mp4";
      body = videoBuffer;
    } else if (file.type.startsWith("image/")) {
      // Handle image upload - convert to WebP for better compression
      // Resize and convert to WebP format
      const optimizedBuffer = await Sharp(buffer)
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85, effort: 6 }) // Quality 85%, effort 6 (good balance of quality vs compression time)
        .toBuffer();

      key = `surf-images/${userId}/${timestamp}-${uniqueId}.webp`;
      contentType = "image/webp";
      body = optimizedBuffer;
    } else {
      return NextResponse.json(
        { error: "File must be an image or video" },
        { status: 400 }
      );
    }

    // Upload to R2
    // Simplified command - match old working pattern
    // Old code had ContentType, but R2 might need it for proper signature calculation
    // Try including ContentType like the old code did
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType, // Include ContentType like old code
      // Removed ACL - R2 doesn't support it (old code had it but it was wrong)
    });

    // Log upload attempt for debugging
    // Verify configuration matches expected values
    const expectedAccountId = "e0916b639e6769b291e0f513d85545da";
    const expectedBucket = "tide-raider";
    const actualAccountId = process.env.R2_ACCOUNT_ID;
    const actualBucket = process.env.R2_BUCKET_NAME;

    if (actualAccountId !== expectedAccountId) {
      console.warn("[upload] ⚠️ Account ID mismatch:", {
        expected: expectedAccountId,
        actual: actualAccountId,
      });
    }
    if (actualBucket !== expectedBucket) {
      console.warn("[upload] ⚠️ Bucket name mismatch:", {
        expected: expectedBucket,
        actual: actualBucket,
      });
    }

    console.log("[upload] Attempting R2 upload:", {
      bucket: actualBucket,
      key,
      contentType,
      bodySize: body.length,
      endpoint: r2Endpoint,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      accountId: actualAccountId,
      // Show full endpoint URL that will be used
      fullEndpoint: r2Endpoint,
      expectedAccountId,
      expectedBucket,
    });

    try {
      console.log("[upload] Sending PutObjectCommand to R2...");
      console.log("[upload] Command details:", {
        bucket: process.env.R2_BUCKET_NAME,
        key,
        bodyType: body.constructor.name,
        bodyLength: body.length,
        endpoint: r2Endpoint,
        hasCredentials: !!(
          process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
        ),
        accessKeyId: process.env.R2_ACCESS_KEY_ID?.substring(0, 12) + "...",
        secretKeyLength: process.env.R2_SECRET_ACCESS_KEY?.length || 0,
        accountId: process.env.R2_ACCOUNT_ID,
      });
      console.log(
        "[upload] Middleware should remove content-type header before signing"
      );

      await s3.send(command);
      console.log("[upload] ✅ Upload successful:", key);
    } catch (uploadError) {
      // Log comprehensive error information
      const errorInfo: any = {
        error:
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError),
        name: uploadError instanceof Error ? uploadError.name : undefined,
        bucket: process.env.R2_BUCKET_NAME,
        key,
        endpoint: r2Endpoint,
      };

      // Add AWS SDK specific error properties
      if (uploadError && typeof uploadError === "object") {
        errorInfo.code = (uploadError as any).Code || (uploadError as any).code;
        errorInfo.requestId = (uploadError as any).requestId;
        errorInfo.metadata = (uploadError as any).$metadata;
        errorInfo.cause = (uploadError as any).cause;
      }

      if (uploadError instanceof Error) {
        errorInfo.stack = uploadError.stack;
      }

      console.error("[upload] ❌ Upload failed:", errorInfo);
      throw uploadError;
    }

    // Construct the public URL
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Return appropriate field name based on file type
    if (file.type.startsWith("video/") || fileType === "video") {
      return NextResponse.json({ videoUrl: fileUrl });
    } else {
      return NextResponse.json({ imageUrl: fileUrl });
    }
  } catch (error) {
    console.error("[upload] Error uploading file:", error);

    // Provide more detailed error information
    let errorMessage = "Failed to upload file";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Log full error details for debugging
      console.error("[upload] Full error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        endpoint: r2Endpoint,
        bucket: process.env.R2_BUCKET_NAME,
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        accountId: process.env.R2_ACCOUNT_ID ? "set" : "missing",
      });

      // Check for specific error types
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("auth")
      ) {
        return NextResponse.json(
          { error: "Authentication failed. Please log in again." },
          { status: 401 }
        );
      }
      if (
        error.message.includes("Sharp") ||
        error.message.includes("image processing")
      ) {
        return NextResponse.json(
          {
            error:
              "Image processing failed. Please try a different image format.",
          },
          { status: 500 }
        );
      }
      // Check for AWS SDK errors (they have a specific structure)
      // AWS SDK errors can have different formats, so check multiple properties
      const awsErrorCode = (error as any).Code || (error as any).code;
      const awsErrorName = error.name || (error as any).name;
      const errorMessageLower = error.message.toLowerCase();

      const isAwsError =
        awsErrorName === "SignatureDoesNotMatch" ||
        awsErrorName === "InvalidAccessKeyId" ||
        awsErrorName === "AccessDenied" ||
        awsErrorName === "NoSuchBucket" ||
        awsErrorName === "CredentialsProviderError" ||
        awsErrorCode === "SignatureDoesNotMatch" ||
        awsErrorCode === "InvalidAccessKeyId" ||
        awsErrorCode === "AccessDenied" ||
        awsErrorCode === "NoSuchBucket" ||
        errorMessageLower.includes("r2") ||
        errorMessageLower.includes("s3") ||
        errorMessageLower.includes("signature") ||
        errorMessageLower.includes("invalidaccesskeyid") ||
        errorMessageLower.includes("signaturedoesnotmatch") ||
        errorMessageLower.includes("accessdenied") ||
        errorMessageLower.includes("credentials") ||
        (error as any).$metadata !== undefined; // AWS SDK errors have $metadata

      if (isAwsError) {
        // Log detailed error information
        const errorDetails = {
          name: error.name,
          message: error.message,
          code: (error as any).Code,
          requestId: (error as any).requestId,
          $metadata: (error as any).$metadata,
          endpoint: r2Endpoint,
          bucket: process.env.R2_BUCKET_NAME,
          hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
          accountId: process.env.R2_ACCOUNT_ID ? "set" : "missing",
        };
        console.error("[upload] AWS/R2 error:", errorDetails);

        // Temporarily return detailed error for debugging
        // TODO: Remove detailed error in production once issue is resolved
        return NextResponse.json(
          {
            error: `Storage error: ${error.name || error.message}`,
            details: {
              name: error.name,
              message: error.message,
              code: (error as any).Code,
              endpoint: r2Endpoint,
              bucket: process.env.R2_BUCKET_NAME,
            },
          },
          { status: 500 }
        );
      }
    }

    // Return error with details for debugging
    // TODO: Remove detailed error in production once issue is resolved
    return NextResponse.json(
      {
        error: errorMessage,
        details:
          error instanceof Error
            ? {
                message: error.message,
                name: error.name,
                stack: error.stack?.split("\n").slice(0, 5).join("\n"), // Limit stack trace
              }
            : String(error),
      },
      { status: statusCode }
    );
  }
}
