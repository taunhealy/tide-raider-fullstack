# Vercel Environment Variable Setup

## Critical: Set NEXT_PUBLIC_API_URL in Vercel

The frontend is currently failing to load regions and beaches because it's trying to connect to the old Fly.io backend instead of Cloud Run.

## Steps to Fix:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `tide-raider` (or your project name)
3. **Go to Settings → Environment Variables**
4. **Add/Update the following variable**:

   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app
   Environment: Production, Preview, Development (select all)
   ```

5. **Redeploy**:
   - Go to Deployments tab
   - Click "..." on the latest deployment
   - Select "Redeploy"
   - Or push a new commit to trigger a new deployment

## Verify:

After redeploying, check:

- https://www.tideraider.com/api/regions should return regions from Cloud Run
- https://www.tideraider.com/raid should show regions and beaches

## Current Status:

- ✅ Backend deployed to Cloud Run: `https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app`
- ✅ Database seeded with 241 beaches and 34 regions
- ⚠️ Frontend still pointing to old Fly.io URL (needs Vercel env var update)

## Alternative: Check Current Vercel Env Vars

You can also check what's currently set in Vercel:

1. Go to Settings → Environment Variables
2. Look for `NEXT_PUBLIC_API_URL`
3. If it exists but points to Fly.io, update it
4. If it doesn't exist, add it with the Cloud Run URL above
