# Create Artifact Registry Repository

## The Problem

The build is failing because the Artifact Registry repository `tide-raider` doesn't exist in `europe-west1` region.

## Solution: Create the Repository

### Option 1: Via Cloud Console (Easiest)

1. Go to: https://console.cloud.google.com/artifacts?project=surf-445620
2. Click **"Create Repository"**
3. Configure:
   - **Name**: `tide-raider`
   - **Format**: **Docker**
   - **Mode**: **Standard** (or **Remote** if you prefer)
   - **Region**: `europe-west1` (Belgium)
4. Click **"Create"**

### Option 2: Use Existing Repository from us-central1

If you want to keep using the existing repository, we can:

1. Change the region back to `us-central1` in `cloudbuild.yaml`
2. Or create a new repository in `europe-west1`

## After Creating Repository

Once the repository exists, the build will work. You can either:

1. **Re-run the build** (if it was triggered automatically)
2. **Push again** to trigger a new build
3. **Manually trigger** from Cloud Build console

## Quick Fix: Use Existing us-central1 Repository

If you want to deploy quickly without creating a new repository, I can change the region back to `us-central1` in `cloudbuild.yaml`. This will use your existing Artifact Registry repository.

Would you like me to:

- **A)** Create the europe-west1 repository (better latency for SA)
- **B)** Change back to us-central1 (use existing repository, faster deployment)
