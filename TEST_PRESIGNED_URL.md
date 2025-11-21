# Testing Presigned URL Upload

## Prerequisites
1. You need to be authenticated (have a valid `auth-token` cookie)
2. Environment variables must be set:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL`

## Step 1: Get Presigned URL

### Using Postman

**Request:**
- Method: `POST`
- URL: `http://localhost:3000/api/upload/presigned` (or your production URL)
- Headers:
  ```
  Content-Type: application/json
  Cookie: auth-token=YOUR_AUTH_TOKEN
  ```
- Body (JSON):
  ```json
  {
    "fileName": "test-image.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000
  }
  ```

**Expected Response:**
```json
{
  "presignedUrl": "https://...",
  "key": "surf-images/user-id/timestamp-randomid.webp",
  "publicUrl": "https://...",
  "contentType": "image/webp"
}
```

### Using cURL

```bash
curl -X POST http://localhost:3000/api/upload/presigned \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_AUTH_TOKEN" \
  -d '{
    "fileName": "test-image.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000
  }'
```

## Step 2: Upload File to Presigned URL

### Using Postman

**Request:**
- Method: `PUT` (IMPORTANT: Must be PUT, not POST)
- URL: Use the `presignedUrl` from Step 1
- Headers:
  ```
  Content-Type: image/webp
  ```
  (Use the `contentType` value from Step 1 response)
- Body:
  - Select "binary" or "file"
  - Upload your image file

**Important Notes:**
- Must use `PUT` method (not POST)
- Must set `Content-Type` header to match the `contentType` from Step 1
- Do NOT add any other headers (this will cause signature mismatch)
- Send the file as raw binary in the body

### Using cURL

```bash
curl -X PUT "PRESIGNED_URL_FROM_STEP_1" \
  -H "Content-Type: image/webp" \
  --data-binary @path/to/your/image.jpg
```

## Step 3: Verify Upload

Check the `publicUrl` from Step 1 - the file should be accessible at that URL.

## Common Issues

### Signature Mismatch Error

**Causes:**
1. Using POST instead of PUT
2. Wrong Content-Type header
3. Extra headers added (like Authorization, User-Agent modifications)
4. Content-Type doesn't match what was signed

**Solutions:**
- Ensure method is `PUT`
- Set Content-Type exactly as returned in Step 1
- Don't add any other headers
- Use raw binary file upload (not form-data)

### Authentication Error

**Cause:** Missing or invalid `auth-token` cookie

**Solution:** 
- First authenticate via `/api/auth/google` or your auth endpoint
- Copy the `auth-token` cookie from browser DevTools → Application → Cookies
- Include it in the Cookie header

## Testing with Different File Types

### Image (will be converted to WebP)
```json
{
  "fileName": "photo.jpg",
  "fileType": "image/jpeg",
  "fileSize": 2048000
}
```
Expected `contentType`: `image/webp`

### Video
```json
{
  "fileName": "video.mp4",
  "fileType": "video/mp4",
  "fileSize": 10485760
}
```
Expected `contentType`: `video/mp4`

## Quick Test Script

Save this as `test-presigned.sh`:

```bash
#!/bin/bash

# Step 1: Get presigned URL
RESPONSE=$(curl -s -X POST http://localhost:3000/api/upload/presigned \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=$AUTH_TOKEN" \
  -d '{
    "fileName": "test.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000
  }')

PRESIGNED_URL=$(echo $RESPONSE | jq -r '.presignedUrl')
CONTENT_TYPE=$(echo $RESPONSE | jq -r '.contentType')
PUBLIC_URL=$(echo $RESPONSE | jq -r '.publicUrl')

echo "Presigned URL: $PRESIGNED_URL"
echo "Content Type: $CONTENT_TYPE"
echo "Public URL: $PUBLIC_URL"

# Step 2: Upload file
curl -X PUT "$PRESIGNED_URL" \
  -H "Content-Type: $CONTENT_TYPE" \
  --data-binary @test-image.jpg

echo "\nFile uploaded! Check: $PUBLIC_URL"
```

Usage:
```bash
export AUTH_TOKEN="your-token-here"
chmod +x test-presigned.sh
./test-presigned.sh
```

