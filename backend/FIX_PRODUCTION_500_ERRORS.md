# Fix Production 500 Errors

## Issues Found

1. **500 errors from `/api/backend-proxy/api/raid-logs` and `/api/backend-proxy/api/blog-posts`**
2. **No regions and beaches data** - Database needs seeding

## Fixes Applied

### 1. Backend Proxy Configuration ✅

Updated `next/app/api/backend-proxy/[...path]/route.ts` to use centralized `api-config.ts` instead of duplicate logic.

### 2. Database Seeding Required ⚠️

The Supabase database needs to be seeded with:
- Continents
- Countries  
- Regions
- Beaches

## Steps to Fix

### Step 1: Verify Cloud Run Backend is Running

1. Check Cloud Run service status:
   ```
   https://console.cloud.google.com/run?project=surf-445620
   ```

2. Verify the service is deployed and healthy:
   - Service: `tide-raider-backend`
   - URL: `https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app`

3. Test the health endpoint:
   ```
   https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/health
   ```

### Step 2: Seed the Database

**Option A: Via Seed Endpoint (Recommended)**

1. Call the seed endpoint:
   ```bash
   curl -X POST https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/seed
   ```

2. Check Cloud Run logs to see seed progress:
   ```
   https://console.cloud.google.com/run?project=surf-445620
   → Click on tide-raider-backend
   → Go to "Logs" tab
   ```

**Option B: Via Local Script**

1. Set DATABASE_URL to Supabase:
   ```bash
   export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.pffssccmdbopnlgjdhwh.supabase.co:5432/postgres"
   ```

2. Run seed script:
   ```bash
   cd backend
   npx tsx prisma/seed-with-beaches.ts
   ```

### Step 3: Verify Data

1. Check Supabase dashboard:
   - Go to: https://supabase.com/dashboard/project/pffssccmdbopnlgjdhwh
   - Navigate to **Table Editor**
   - Verify you see:
     - `Continent` table with data
     - `Country` table with data
     - `Region` table with data
     - `Beach` table with data

2. Test API endpoints:
   ```
   https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/beaches
   https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/regions
   ```

### Step 4: Check Frontend Configuration

Verify `NEXT_PUBLIC_API_URL` is set in Vercel:
1. Go to Vercel project settings
2. Environment Variables
3. Ensure `NEXT_PUBLIC_API_URL` is set to:
   ```
   https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app
   ```

## Common Issues

### Issue: "Proxy request failed"
**Cause:** Backend is not responding or returning errors
**Fix:** 
- Check Cloud Run logs for backend errors
- Verify DATABASE_URL is set correctly in Cloud Run secrets
- Check if backend service is running

### Issue: "No regions/beaches"
**Cause:** Database hasn't been seeded
**Fix:** Run the seed script (Step 2 above)

### Issue: "Cannot connect to database"
**Cause:** DATABASE_URL incorrect or Supabase paused
**Fix:**
- Verify DATABASE_URL in Cloud Run secrets
- Check Supabase dashboard - wake up database if paused
- Use connection pooler URL for Cloud Run:
  ```
  postgresql://postgres.pffssccmdbopnlgjdhwh:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```

## Verification Checklist

- [ ] Cloud Run backend is deployed and running
- [ ] `/health` endpoint returns 200
- [ ] DATABASE_URL secret is set in Cloud Run
- [ ] Database has been seeded (check Supabase Table Editor)
- [ ] `/api/beaches` endpoint returns data
- [ ] `/api/regions` endpoint returns data
- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] Frontend can successfully proxy to backend

## Next Steps After Fixing

1. Test OAuth flow end-to-end
2. Verify all API endpoints work
3. Check that data loads correctly on frontend
4. Monitor Cloud Run logs for any errors

