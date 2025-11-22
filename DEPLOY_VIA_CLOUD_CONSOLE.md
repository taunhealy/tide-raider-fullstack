# Deploy Backend via Cloud Console (No gcloud CLI needed)

## Step-by-Step Instructions

### 1. Open Cloud Build Console

Go to: https://console.cloud.google.com/cloud-build/builds?project=surf-445620

### 2. Create New Build

1. Click **"Create Build"** button (top of the page)
2. Select **"Cloud Build configuration file (yaml or json)"** option

### 3. Configure Build

Fill in the following:

**Source:**

- **Repository**: Select your GitHub repository (`tide-raider-fullstack`)
- **Branch**: `main` (or your default branch)
- **Configuration file location**: `backend/cloudbuild.yaml`

**Substitution variables** (click "Show variables"):

- `_REGION`: `europe-west1` (Belgium - better latency for South Africa)
- `_SERVICE_NAME`: `tide-raider-backend`
- `_ARTIFACT_REGISTRY_REPO`: `tide-raider`

### 4. Run Build

Click **"Run"** button

### 5. Monitor Progress

- The build will take ~5-10 minutes
- You'll see logs in real-time
- Wait for "SUCCESS" status

### 6. Get New Service URL

After deployment, the service URL will be different (europe-west1 instead of us-central1).

**Get the new URL:**

1. Go to: https://console.cloud.google.com/run?project=surf-445620
2. Click on **"tide-raider-backend"** service
3. Copy the **Service URL** (it will be something like: `https://tide-raider-backend-xxxxx-ew.a.run.app`)

### 7. Update Frontend Configuration

**Important:** Update your frontend to use the new URL:

1. **Vercel Environment Variable:**

   - Go to Vercel Dashboard → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` with the new europe-west1 URL
   - Redeploy frontend

2. **Local Development:**
   - Update `next/.env.local` with the new URL (optional - you can keep using localhost:4001 for local dev)

### 8. Verify Deployment

Test the forecast endpoint with the new URL:

```
https://tide-raider-backend-xxxxx-ew.a.run.app/api/forecast?regionId=bali&forecastDate=2025-11-22&source=WINDFINDER
```

You should get forecast data (even if it's from a different date) instead of 404.

## What This Deploys

✅ Backend forecast endpoint with fallback logic:

- Returns most recent forecast if exact date not found
- Works for all sources (WINDFINDER, WINDGURU, WINDY)
- Only returns 404 if absolutely no data exists

## Alternative: Quick Deploy via Cloud Run UI

If Cloud Build doesn't work, you can also:

1. Go to: https://console.cloud.google.com/run?project=surf-445620
2. Click on **"tide-raider-backend"** service
3. Click **"EDIT & DEPLOY NEW REVISION"**
4. Under **"Source"**, select **"Continuously deploy new revisions from a source repository"**
5. Select your GitHub repo and branch
6. Set **Dockerfile path**: `backend/Dockerfile`
7. Set **Build context**: `backend/`
8. Click **"DEPLOY"**

This will trigger a new build and deployment automatically.
