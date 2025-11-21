# R2 CORS Configuration Guide

## Problem

When uploading files directly to R2 from the browser using presigned URLs, you'll get a CORS error:

```
Access to fetch at 'https://...r2.cloudflarestorage.com/...' from origin 'https://www.tideraider.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## Solution: Configure CORS in R2 Bucket

### Step 1: Access R2 Bucket Settings

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **Object Storage**
3. Click on your bucket: **tide-raider**
4. Go to the **Settings** tab

### Step 2: Add CORS Policy

1. Scroll to the **CORS Policy** section
2. Click **Add CORS policy** or **Edit CORS policy**
3. Paste the following JSON configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://www.tideraider.com",
      "https://tideraider.com",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": [
      "content-type",
      "x-amz-date",
      "x-amz-content-sha256",
      "authorization"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 3: Save the Policy

1. Click **Save** to apply the CORS policy
2. The policy should take effect immediately

## Configuration Details

- **AllowedOrigins**: Your production domain and local development URLs
- **AllowedMethods**:
  - `PUT` - Required for uploading files
  - `GET` - For retrieving files (if needed)
  - `HEAD` - For checking file existence
- **AllowedHeaders**: Headers that the browser is allowed to send
- **ExposeHeaders**: Headers that the browser can read from the response
- **MaxAgeSeconds**: How long browsers can cache the CORS preflight response

## Testing

After configuring CORS, try uploading an image again. The CORS error should be resolved.

## Alternative: Server-Side Uploads

If you prefer not to configure CORS, you can use server-side uploads instead (files go through your Next.js API). However, this requires fixing the signature mismatch issue with direct R2 uploads.
