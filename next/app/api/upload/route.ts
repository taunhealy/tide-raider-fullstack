import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
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
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2 to generate correct signatures
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Use backend authentication
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
      console.warn("[upload] No user ID found in auth result");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upload files." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("type") as string; // "image" or "video"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size based on type
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
    const MAX_VIDEO_SIZE = 55 * 1024 * 1024; // 55MB for videos

    if (file.type.startsWith("video/") || fileType === "video") {
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          {
            error: `Video file is too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
          },
          { status: 413 }
        );
      }
    } else if (file.type.startsWith("image/")) {
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            error: `Image file is too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
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

      // Get file extension
      const extension = file.name.split(".").pop() || "mp4";
      key = `surf-videos/${user.id}/${timestamp}-${uniqueId}.${extension}`;
      contentType = file.type;
      body = buffer; // Upload video as-is (no compression)
    } else if (file.type.startsWith("image/")) {
      // Handle image upload (existing logic)
      // Compress and resize image
      const optimizedBuffer = await Sharp(buffer)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      key = `surf-images/${user.id}/${timestamp}-${uniqueId}.jpg`;
      contentType = "image/jpeg";
      body = optimizedBuffer;
    } else {
      return NextResponse.json(
        { error: "File must be an image or video" },
        { status: 400 }
      );
    }

    // Upload to R2 with cache headers
    // Note: R2 doesn't support ACL parameter - files are made public via bucket policy
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Remove ACL - R2 doesn't support it, use bucket policy for public access instead
      // Add cache headers to reduce server load
      CacheControl: "public, max-age=31536000, immutable", // Cache for 1 year
      Metadata: {
        "upload-timestamp": timestamp.toString(),
        "file-type":
          fileType || (file.type.startsWith("video/") ? "video" : "image"),
      },
    });

    await s3.send(command);

    // Construct the public URL
    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Return appropriate field name based on file type
    if (file.type.startsWith("video/") || fileType === "video") {
      return NextResponse.json({ videoUrl: fileUrl });
    } else {
      return NextResponse.json({ imageUrl: fileUrl });
    }
  } catch (error) {
    console.error("Error uploading file:", error);

    // Provide more detailed error information
    let errorMessage = "Failed to upload file";
    if (error instanceof Error) {
      errorMessage = error.message;
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
      if (error.message.includes("R2") || error.message.includes("S3")) {
        return NextResponse.json(
          { error: "Storage service error. Please try again later." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
