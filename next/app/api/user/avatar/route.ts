import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

// Add timeout configuration for S3 client
const S3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestHandler: {
    // Set timeout for S3 operations
    requestTimeout: 5000, // 5 seconds
  },
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // Add file size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 413 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const uniqueFilename = `${uuidv4()}-${file.name}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Add upload timeout handling
    const uploadPromise = S3.send(
      new PutObjectCommand({
        Bucket: "tide-raider",
        Key: uniqueFilename,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Race the upload against a timeout
    const uploadResult = await Promise.race([
      uploadPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Upload timeout")), 10000)
      ),
    ]);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: `https://media.tideraider.com/${uniqueFilename}`,
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("Avatar update error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    // Handle specific timeout errors
    if (errorMessage.includes("timeout")) {
      return NextResponse.json(
        { error: "Storage service timeout" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
