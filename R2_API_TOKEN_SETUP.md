# R2 API Token Setup Guide

## Problem

You're seeing "There are currently no Account API tokens for your buckets" and getting signature mismatch errors.

## Solution: Create an R2 API Token

### Step 1: Go to R2 API Tokens

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **Object Storage**
3. Click on **Manage R2 API Tokens** (usually in the top right or in Settings)

### Step 2: Create a New Token

**Important**: You need to create an **Account API Token** (not a User API Token)

- **Account API Tokens** have access to account-level services like R2
- **User API Tokens** are for user-specific operations and won't work for R2 buckets

1. Make sure you're on the **Account API Tokens** tab (not User API Tokens)
2. Click **Create API Token**
3. Fill in the details:
   - **Token Name**: `tide-raider-upload` (or any descriptive name)
   - **Permissions**: Select **Object Read & Write**
   - **TTL**: Leave as "Never expire" (or set a custom expiration)
   - **Allow List Operations**: ✅ Check this box (allows listing buckets)
   - **Client IP Address Filtering**: ⚠️ **Leave empty** (default - allows all IPs)
     - Since your app runs on Vercel with dynamic IPs, restricting IPs would block legitimate requests
     - Only use IP filtering if you have a static server IP

### Step 3: Select Bucket Access

1. Under **Bucket Access**, select:
   - **tide-raider** bucket
   - **Read and Write** permissions

### Step 4: Create Token

1. Click **Create API Token**
2. **IMPORTANT**: Copy both values immediately:
   - **Access Key ID** (starts with something like `75317f9ef7e3833cb510165b07e07095`)
   - **Secret Access Key** (long random string - you can only see this once!)

### Step 5: Update Environment Variables

**Important Notes:**

- Use the **Access Key ID** and **Secret Access Key** (NOT the "Token value")
- Use the **Default** endpoint (not EU or other jurisdiction-specific endpoints)

Add these to your Vercel environment variables:

```
R2_ACCOUNT_ID=e0916b639e6769b291e0f513d85545da
R2_ACCESS_KEY_ID=2c1f8163191243c60178df58250df7b5
R2_SECRET_ACCESS_KEY=bbdb816d159d35a82d089beae727322ee06d4c1c394ddaa4a024df8f47b01a31
R2_BUCKET_NAME=tide-raider
R2_PUBLIC_URL=https://media.tideraider.com
```

**Note**: Replace the Access Key ID and Secret Access Key above with your actual values if different.

### Step 6: Redeploy

After setting the environment variables, **redeploy your Vercel application** for the changes to take effect.

## Verification

After creating the token and updating environment variables:

1. Try uploading an image again
2. Check your server logs - you should see:
   - `[upload] ✅ Upload successful:` (if it works)
   - Or detailed error messages if there are still issues

## Important Notes

- **Secret Access Key is only shown once** - if you lose it, you'll need to create a new token
- The token needs **Object Read & Write** permissions
- Make sure the token has access to the **tide-raider** bucket
- The **Access Key ID** and **Secret Access Key** must match exactly (no extra spaces)

## Troubleshooting

If you still get signature mismatch errors after creating the token:

1. **Verify the token has the right permissions**:

   - Go back to R2 API Tokens
   - Check that your token shows "Object Read & Write" permissions
   - Verify it has access to the "tide-raider" bucket

2. **Check environment variables in Vercel**:

   - Go to Vercel → Your Project → Settings → Environment Variables
   - Verify all 5 R2 variables are set correctly
   - Make sure there are no extra spaces or quotes

3. **Redeploy after setting variables**:

   - Environment variables only take effect after redeployment
   - Go to Deployments → Redeploy

4. **Check server logs**:
   - Look for `[upload] Command details:` in your logs
   - Verify `hasCredentials: true` in the logs
   - Check the `accessKeyPrefix` matches your token
