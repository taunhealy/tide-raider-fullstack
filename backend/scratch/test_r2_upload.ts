import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const sanitize = (val: string | undefined): string => {
  if (!val) return "";
  // Trim whitespace and remove invisible/control characters (newlines, carriage returns, etc)
  return val.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, "");
};

async function testUpload() {
  console.log("🚀 Starting R2 Upload Test...");

  const r2AccountId = sanitize(process.env.R2_ACCOUNT_ID);
  const region = "auto";
  const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com`;
  const accessKeyId = sanitize(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = sanitize(process.env.R2_SECRET_ACCESS_KEY);
  const bucketName = process.env.R2_BUCKET_NAME;

  console.log(`📡 Endpoint: ${endpoint}`);
  console.log(`📦 Bucket: ${bucketName}`);
  console.log(`🔑 Access Key (sanitized length): ${accessKeyId.length}`);
  console.log(`🔒 Secret Key (sanitized length): ${secretAccessKey.length}`);

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    console.error("❌ Missing required environment variables!");
    return;
  }

  const s3 = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const testKey = `test-upload-${Date.now()}.txt`;
  const body = "This is a test file to verify the Tide Raider R2 upload fix.";

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: body,
      ContentType: "text/plain",
    });

    console.log(`📤 Uploading ${testKey}...`);
    await s3.send(command);
    console.log("✅ SUCCESS! File uploaded successfully.");
    console.log(`🔗 Public URL: ${process.env.R2_PUBLIC_URL}/${testKey}`);
  } catch (error: any) {
    console.error("❌ FAILED!");
    console.error(`Error Name: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    if (error.message.includes("header")) {
      console.error("🔍 This looks like a header/character issue! Sanitation may have failed or characters are persistent.");
    }
  }
}

testUpload();
