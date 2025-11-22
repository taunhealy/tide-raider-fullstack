# Deploy to Africa South1 (Johannesburg) - Best for South Africa

## Why Africa South1?

- ✅ **Lowest latency** from South Africa (~10-50ms vs ~150-300ms from other regions)
- ✅ **Best performance** for your users
- ✅ **Same pricing** as other regions
- ✅ **Local data center** - faster response times

## Important: Artifact Registry Repository

⚠️ **You'll need to create the Artifact Registry repository in `africa-south1`**:

1. Go to: https://console.cloud.google.com/artifacts?project=surf-445620
2. Click **"Create Repository"**
3. Configure:
   - **Name**: `tide-raider`
   - **Format**: **Docker**
   - **Mode**: **Standard**
   - **Region**: `africa-south1` (Johannesburg)
   - ✅ **Enable vulnerability scanning** (free, recommended)
4. Click **"Create"**

## After Creating Repository

Once the repository exists:

1. **Commit and push** your changes:

   ```bash
   git add backend/cloudbuild.yaml backend/src/routes/forecast.ts
   git commit -m "Add forecast fallback logic and deploy to africa-south1"
   git push origin main
   ```

2. **Cloud Build will automatically deploy** to `africa-south1`

3. **Get new service URL** (will be different from us-central1):

   - Go to: https://console.cloud.google.com/run?project=surf-445620
   - Service URL will be: `https://tide-raider-backend-xxxxx-af.a.run.app`

4. **Update Vercel environment variable**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` with the new africa-south1 URL
   - Redeploy frontend

## Benefits

- 🚀 **Much faster** API responses for South African users
- 🚀 **Better user experience** - lower latency
- 🚀 **Local region** - data stays closer to home

## Note

The service URL will change from:

- **Old**: `https://tide-raider-backend-xxxxx-uc.a.run.app` (us-central1)
- **New**: `https://tide-raider-backend-xxxxx-af.a.run.app` (africa-south1)

Make sure to update `NEXT_PUBLIC_API_URL` in Vercel after deployment!
