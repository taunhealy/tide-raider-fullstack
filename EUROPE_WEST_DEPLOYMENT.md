# Deploy to Europe West (Better for South Africa)

## Why Europe West?

- ✅ **Lower latency** from South Africa (~150-200ms vs ~300-400ms from US)
- ✅ **Better performance** for your users
- ✅ **Same pricing** as US regions

## Important Notes

⚠️ **The service URL will change!**

- **Old URL (us-central1)**: `https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app`
- **New URL (europe-west1)**: `https://tide-raider-backend-xxxxx-ew.a.run.app`

After deployment, you **must** update:
1. ✅ Vercel environment variable `NEXT_PUBLIC_API_URL`
2. ✅ Any hardcoded backend URLs (though we've centralized this)

## Deployment Steps

### Option 1: Cloud Build Console (Recommended)

1. Go to: https://console.cloud.google.com/cloud-build/builds/create?project=surf-445620
2. Select: **"Cloud Build configuration file (yaml or json)"**
3. Configure:
   - **Repository**: Your GitHub repo
   - **Branch**: `main`
   - **Config file**: `backend/cloudbuild.yaml`
   - **Variables**:
     - `_REGION`: `europe-west1`
     - `_SERVICE_NAME`: `tide-raider-backend`
     - `_ARTIFACT_REGISTRY_REPO`: `tide-raider`
4. Click **"Run"**

### Option 2: Keep Existing Service, Just Update Code

If you want to keep the existing us-central1 service (don't change region):

1. Go to: https://console.cloud.google.com/run?project=surf-445620
2. Click **"tide-raider-backend"** service
3. Click **"EDIT & DEPLOY NEW REVISION"**
4. Select **"Continuously deploy from source"**
5. Set **Dockerfile**: `backend/Dockerfile`
6. Set **Build context**: `backend/`
7. Click **"DEPLOY"**

This will deploy the forecast fallback fix without changing regions.

## After Deployment

1. **Get new service URL** (if you changed regions)
2. **Update Vercel** `NEXT_PUBLIC_API_URL` environment variable
3. **Redeploy frontend** on Vercel
4. **Test** the forecast endpoint

## Recommendation

For now, I'd suggest:
- **Keep us-central1** for this deployment (just deploy the forecast fix)
- **Consider migrating to europe-west1** later if you want better latency

This way you don't have to update URLs immediately, and you can test the forecast fix first.

