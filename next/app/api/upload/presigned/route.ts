import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client for Cloudflare R2
// For R2 presigned URLs, we need to use a specific configuration
const s3 = new S3Client({
  region: "auto", // R2 uses "auto" as the region
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for R2 - uses path-style URLs
  // Disable signature version 4 payload signing for R2 compatibility
  // R2 uses a modified version of S3's signature algorithm
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
    // For R2 presigned URLs, only include Bucket and Key to avoid signature mismatches
    // ContentType is NOT included in the signature - client can set it when uploading
    // This prevents signature mismatches that occur when ContentType doesn't match exactly
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      // Do NOT include ContentType, CacheControl, Metadata, or any other optional parameters
      // These cause signature mismatches with R2 if the client doesn't send them exactly
    });

    // Generate presigned URL (valid for 5 minutes)
    // The client should set ContentType header when uploading, but it's not part of the signature
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    // Construct the public URL that will be used after upload
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl,
      contentType, // Return ContentType so client knows what to set
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
