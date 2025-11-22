# Fix Cloud Run 403 Forbidden Error

## Problem
The backend is returning `403 Forbidden` because it's not allowing unauthenticated invocations.

## Solution: Allow Unauthenticated Invocations

### Option 1: Via Google Cloud Console (Easiest)

1. **Go to Cloud Run Console:**
   https://console.cloud.google.com/run?project=surf-445620

2. **Click on "tide-raider-backend"** service

3. **Click "EDIT & DEPLOY NEW REVISION"** (top of the page)

4. **Go to "Security" tab** (in the left sidebar)

5. **Under "Authentication":**
   - Select: **"Allow unauthenticated invocations"**
   - This allows anyone to call your API without authentication

6. **Click "DEPLOY"** (bottom of the page)

7. **Wait for deployment** (~1-2 minutes)

8. **Test again:**
   ```powershell
   curl https://tide-raider-backend-82632174665.africa-south1.run.app/api/health
   ```

   Should return: `{"status":"ok"}`

### Option 2: Via gcloud CLI (If you have it installed)

```powershell
gcloud run services add-iam-policy-binding tide-raider-backend `
  --region=africa-south1 `
  --member="allUsers" `
  --role="roles/run.invoker" `
  --project=surf-445620
```

## Why This Is Needed

Cloud Run services are **private by default** for security. Since your frontend (Vercel) needs to call the backend API, you need to make it publicly accessible.

**Note:** This only makes the API endpoints public. Your backend still has:
- ✅ Authentication for protected routes (via JWT tokens)
- ✅ CORS protection (only your frontend domain can call it)
- ✅ Rate limiting and other security measures

## After Fixing

Once you've allowed unauthenticated invocations:
- ✅ Frontend can call the backend API
- ✅ OAuth will work
- ✅ All API endpoints will be accessible
- ✅ Health check will return `{"status":"ok"}`

