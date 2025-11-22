# Fix Africa South1 Deployment Issues

## Issue 1: 403 Errors in Cloud Run

The backend is returning 403 errors because it's not allowing unauthenticated invocations.

### Fix:

1. Go to Cloud Run Console: https://console.cloud.google.com/run?project=surf-445620
2. Click on **"tide-raider-backend"** service
3. Click **"EDIT & DEPLOY NEW REVISION"**
4. Go to **"Security"** tab
5. Under **"Authentication"**, select:
   - ✅ **"Allow unauthenticated invocations"**
6. Click **"DEPLOY"**

## Issue 2: Frontend Still Using Old URL

Your local `.env.local` file has `NEXT_PUBLIC_API_URL` set to the old `us-central1` URL.

### Fix:

1. **Update `next/.env.local`** (or create it if it doesn't exist):

```env
NEXT_PUBLIC_API_URL=https://tide-raider-backend-82632174665.africa-south1.run.app
```

2. **Restart your Next.js dev server**:
   ```bash
   # Stop the current server (Ctrl+C)
   cd next
   npm run dev
   ```

3. **Verify it's using the new URL**:
   - Check the terminal logs - you should see:
     ```
     [auth/me] Backend URL: https://tide-raider-backend-82632174665.africa-south1.run.app
     [proxy] Forwarding GET request to: https://tide-raider-backend-82632174665.africa-south1.run.app
     ```

## Issue 3: Update Vercel Environment Variable

For production, update Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_API_URL`
3. Update value to: `https://tide-raider-backend-82632174665.africa-south1.run.app`
4. Redeploy the frontend

## Quick Test

After fixing, test the backend:

```bash
curl https://tide-raider-backend-82632174665.africa-south1.run.app/api/health
```

Should return: `{"status":"ok"}` (not 403)

## Summary

✅ **Cloud Run**: Allow unauthenticated invocations  
✅ **Local `.env.local`**: Update `NEXT_PUBLIC_API_URL`  
✅ **Vercel**: Update `NEXT_PUBLIC_API_URL` environment variable  
✅ **Restart**: Restart Next.js dev server

