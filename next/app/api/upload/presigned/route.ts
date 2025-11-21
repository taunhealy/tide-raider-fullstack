import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client for Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2 presigned URLs
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Use backend authentication
    const { user } = await getServerAuth();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Missing fileName or fileType" },
        { status: 400 }
      );
    }

    // Validate file size based on type
    const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB for images
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos

    if (fileType.startsWith("video/")) {
      if (fileSize > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          {
            error: `Video file is too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB. Your file is ${(fileSize / (1024 * 1024)).toFixed(2)}MB.`,
          },
          { status: 413 }
        );
      }
    } else if (fileType.startsWith("image/")) {
      if (fileSize > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          {
            error: `Image file is too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB. Your file is ${(fileSize / (1024 * 1024)).toFixed(2)}MB.`,
          },
          { status: 413 }
        );
      }
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);

    let key: string;
    let contentType: string = fileType;

    if (fileType.startsWith("video/")) {
      const extension = fileName.split(".").pop() || "mp4";
      key = `surf-videos/${user.id}/${timestamp}-${uniqueId}.${extension}`;
    } else {
      // Images are converted to WebP, so always use .webp extension
      key = `surf-images/${user.id}/${timestamp}-${uniqueId}.webp`;
      // Update ContentType to WebP for images
      contentType = "image/webp";
    }

    // Create PutObject command
    // Note: R2 doesn't support ACL parameter - files are made public via bucket policy
    // Only include essential parameters in presigned URL to avoid signature mismatches
    // Metadata and CacheControl can cause issues if client doesn't send them exactly
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
      // Removed CacheControl and Metadata from presigned URL to prevent signature mismatches
      // These can be set via a separate API call if needed, or rely on bucket defaults
    });

    // Generate presigned URL (valid for 5 minutes)
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    // Construct the public URL that will be used after upload
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate upload URL",
      },
      { status: 500 }
    );
  }
}
