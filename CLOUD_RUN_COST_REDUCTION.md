# Cloud Run Cost Reduction Guide

## Changes Made

### 1. DATABASE_URL Configuration

**Problem**: Build script was trying to use `DATABASE_URL` secret, but you have `DATABASE_URL_SUPABASE` set as an environment variable in Cloud Run.

**Solution**:
- ✅ Removed `DATABASE_URL` secret reference from `cloudbuild.yaml`
- ✅ Updated `backend/src/lib/prisma.ts` to check for `DATABASE_URL_SUPABASE` if `DATABASE_URL` is not set
- ✅ Your existing `DATABASE_URL_SUPABASE` environment variable in Cloud Run will now be used automatically

**What this means**:
- No need to create/update a `DATABASE_URL` secret
- The code automatically uses `DATABASE_URL_SUPABASE` from Cloud Run
- No changes needed in Cloud Run console - it will work with your existing setup

### 2. Artifact Registry Cost Reduction

**Quick Fix - Disable Vulnerability Scanning** (Saves the most money):

```bash
gcloud artifacts repositories update tide-raider \
  --location=europe-west1 \
  --no-scan-on-push
```

**Or via Cloud Console**:
1. Go to [Artifact Registry](https://console.cloud.google.com/artifacts)
2. Select repository: `tide-raider`
3. Click **Edit**
4. Uncheck **Scan on push** under Vulnerability scanning
5. Click **Save**

**Additional Cost Savings - Auto-delete Old Images**:

```bash
# Create lifecycle policy to keep only last 10 images
cat > lifecycle-policy.json << 'EOF'
{
  "rules": [
    {
      "description": "Delete untagged images older than 7 days",
      "action": { "type": "DELETE" },
      "condition": {
        "tagState": "UNTAGGED",
        "olderThan": "7d"
      }
    },
    {
      "description": "Keep only last 10 tagged images per tag",
      "action": { "type": "DELETE" },
      "condition": {
        "tagState": "TAGGED",
        "olderThan": "30d"
      }
    }
  ]
}
EOF

gcloud artifacts repositories update tide-raider \
  --location=europe-west1 \
  --lifecycle-policy=lifecycle-policy.json
```

## Verify Everything Works

### 1. Check DATABASE_URL is working:

After your next deployment, check the logs:
```bash
gcloud run services logs read tide-raider-backend \
  --region=europe-west1 \
  --limit=50
```

Look for:
- ✅ `[prisma] ✅ Using Supabase pooler...` (if using pooler)
- ❌ No `DATABASE_URL is required but was not provided` errors

### 2. Check Artifact Registry costs:

```bash
# View current images
gcloud artifacts docker images list \
  europe-west1-docker.pkg.dev/$(gcloud config get-value project)/tide-raider/tide-raider-backend

# Check repository settings
gcloud artifacts repositories describe tide-raider \
  --location=europe-west1 \
  --format="yaml(scanOnPush,lifecyclePolicy)"
```

## Next Steps

1. **Disable vulnerability scanning** (run the command above)
2. **Set up lifecycle policy** (optional, but recommended)
3. **Deploy your next build** - it will automatically use `DATABASE_URL_SUPABASE`
4. **Monitor costs** in [Cloud Billing Console](https://console.cloud.google.com/billing)

## Notes

- **No breaking changes**: Your existing `DATABASE_URL_SUPABASE` in Cloud Run will work immediately
- **Backward compatible**: Code still checks `DATABASE_URL` first, then falls back to `DATABASE_URL_SUPABASE`
- **Artifact Registry**: Disabling scanning is the biggest cost saver - storage costs are usually minimal


