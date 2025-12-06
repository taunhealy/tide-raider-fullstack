# Reducing Artifact Registry Costs

This guide explains how to reduce costs from Artifact Registry scanning and storage.

## Why Artifact Registry Costs Money

Artifact Registry can incur costs from:
1. **Storage**: Storing Docker images
2. **Vulnerability Scanning**: Automatic scanning of images (if enabled)
3. **Network Egress**: Downloading images (usually minimal)

## Solutions to Reduce Costs

### Option 1: Disable Vulnerability Scanning (Recommended)

Vulnerability scanning is often the biggest cost driver. Disable it:

```bash
# Disable scanning for your repository
gcloud artifacts repositories update tide-raider \
  --location=europe-west1 \
  --no-scan-on-push
```

Or via Cloud Console:
1. Go to [Artifact Registry](https://console.cloud.google.com/artifacts)
2. Select your repository: `tide-raider`
3. Click **Edit**
4. Under **Vulnerability scanning**, uncheck **Scan on push**
5. Click **Save**

### Option 2: Set Up Lifecycle Policies (Auto-Delete Old Images)

Automatically delete old images to reduce storage costs:

```bash
# Create a lifecycle policy that keeps only the last 5 images
gcloud artifacts repositories update tide-raider \
  --location=europe-west1 \
  --lifecycle-policy=lifecycle-policy.json
```

Create `lifecycle-policy.json`:
```json
{
  "rules": [
    {
      "description": "Keep only the last 5 images",
      "action": {
        "type": "DELETE"
      },
      "condition": {
        "tagState": "UNTAGGED",
        "olderThan": "30d"
      }
    },
    {
      "description": "Keep only latest 5 tagged images",
      "action": {
        "type": "DELETE"
      },
      "condition": {
        "tagState": "TAGGED",
        "tagPrefixes": ["latest"],
        "olderThan": "30d"
      }
    }
  ]
}
```

### Option 3: Delete Old Images Manually

```bash
# List all images
gcloud artifacts docker images list \
  europe-west1-docker.pkg.dev/$(gcloud config get-value project)/tide-raider/tide-raider-backend

# Delete specific image
gcloud artifacts docker images delete \
  europe-west1-docker.pkg.dev/$(gcloud config get-value project)/tide-raider/tide-raider-backend:BUILD_ID

# Delete all images except latest 5
gcloud artifacts docker images list \
  europe-west1-docker.pkg.dev/$(gcloud config get-value project)/tide-raider/tide-raider-backend \
  --format="value(package)" | tail -n +6 | xargs -I {} gcloud artifacts docker images delete {}
```

### Option 4: Use Container Registry Instead (Legacy, but free tier)

If you're on a tight budget, you could use the older Container Registry (gcr.io) which has a free tier, but Artifact Registry is recommended for new projects.

### Option 5: Build Without Pushing (Not Recommended)

You could modify `cloudbuild.yaml` to build locally and deploy directly, but this loses the benefits of Artifact Registry (versioning, rollback, etc.).

## Recommended Approach

**Best practice**: Disable vulnerability scanning + set up lifecycle policies:

```bash
# 1. Disable scanning
gcloud artifacts repositories update tide-raider \
  --location=europe-west1 \
  --no-scan-on-push

# 2. Set lifecycle policy (keeps last 10 images, deletes older)
cat > lifecycle-policy.json << EOF
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
      "description": "Keep only last 10 tagged images",
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

## Verify Changes

```bash
# Check repository settings
gcloud artifacts repositories describe tide-raider \
  --location=europe-west1

# Check current images and sizes
gcloud artifacts docker images list \
  europe-west1-docker.pkg.dev/$(gcloud config get-value project)/tide-raider/tide-raider-backend \
  --format="table(package,create_time,update_time)"
```

## Cost Monitoring

Monitor your costs:
1. Go to [Cloud Billing](https://console.cloud.google.com/billing)
2. Select your project
3. View **Cost breakdown** → Filter by **Artifact Registry**
4. Set up billing alerts if needed

## Notes

- **Storage costs**: ~$0.10 per GB/month (usually minimal for Docker images)
- **Scanning costs**: Can be significant if enabled - disabling saves the most
- **Lifecycle policies**: Run automatically, no manual intervention needed
- **Old images**: Can always be rebuilt from source, so safe to delete


