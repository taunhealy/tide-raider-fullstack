# Vercel Frontend Setup

## Environment Variable Required

To connect your frontend (tideraider.com) to the Fly.io backend, you need to set this environment variable in Vercel:

### Variable Name:
```
NEXT_PUBLIC_API_URL
```

### Variable Value:
```
https://tide-raider-backend.fly.dev
```

## How to Set in Vercel:

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project (tideraider.com)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://tide-raider-backend.fly.dev`
   - **Environment**: Select **Production** (and **Preview** if you want)
6. Click **Save**
7. **Redeploy** your application (or wait for the next deployment)

## Verification:

After setting the variable and redeploying, your frontend at `tideraider.com` will:
- Make API calls to `https://tide-raider-backend.fly.dev/api/*`
- Use the Fly.io backend for all backend operations
- Share the same database (via DATABASE_URL secret in Fly.io)

## Current Status:

✅ Backend deployed: `https://tide-raider-backend.fly.dev`  
✅ Frontend code configured to use backend API  
⏳ **Action Required**: Set `NEXT_PUBLIC_API_URL` in Vercel

## Testing:

Once set, you can test by:
1. Opening browser DevTools → Network tab
2. Visit tideraider.com
3. Check API requests - they should go to `tide-raider-backend.fly.dev`

