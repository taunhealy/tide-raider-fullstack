# Deploy All Fixes

## Summary of Fixes Ready to Deploy

### 1. ✅ PgBouncer Prepared Statements Fix

**File**: `backend/src/lib/prisma.ts`

- Automatically adds `?pgbouncer=true` to DATABASE_URL when using Supabase pooler
- Explicitly passes optimized URL to PrismaClient constructor
- Added logging to verify the fix is working

### 2. ✅ Cloud Run Memory Limit Fix

**File**: `backend/cloudbuild.yaml`

- Increased memory from 512Mi to 2Gi
- Increased CPU from 1 to 2

### 3. ✅ Memory-Saving Chrome Flags

**Files**:

- `backend/src/lib/scrapers/scraperA.ts`
- `backend/src/lib/scrapers/scraperB.ts`
- `backend/src/lib/scrapers/scraperC.ts`
- Added memory-saving flags to reduce Chromium memory usage

### 4. ✅ Frontend API Routes

**Files**:

- `next/app/api/regions/route.ts`
- `next/app/api/surf-conditions/route.ts`
- `next/app/api/beaches/search/route.ts`
- `next/app/api/beaches/[name]/route.ts`
- `next/app/api/raid-logs/route.ts`
- `next/app/api/auth/me/route.ts`
- Updated to use `api-config.ts` instead of hardcoded Fly.io URLs

### 5. ✅ OAuth URL Fixes

**Files**:

- `next/app/lib/auth-utils.ts`
- `next/app/auth/signin/page.tsx`
- Updated to call `getBackendUrl()` at runtime instead of module load time

### 6. ✅ TypeScript/ESLint Fixes

**Files**:

- `next/app/components/alerts/AlertConfiguration.tsx`
- `next/.eslintrc.json`
- Fixed TypeScript errors and ESLint config

## Deployment Steps

### Backend (Cloud Run)

1. Commit all backend changes
2. Push to trigger Cloud Build
3. Monitor deployment in Cloud Build console
4. Check Cloud Run logs for:
   - `[prisma] ✅ Added pgbouncer=true for Supabase pooler`
   - `[prisma] ✅ Verified: pgbouncer=true is in connection URL`
   - No more "prepared statement already exists" errors

### Frontend (Vercel)

1. Commit all frontend changes
2. Push to trigger Vercel deployment
3. Set `NEXT_PUBLIC_API_URL` in Vercel environment variables:
   - Value: `https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app`
4. Verify deployment succeeds
5. Test OAuth flow

## Verification Checklist

After deployment:

### Backend

- [ ] Cloud Run logs show `pgbouncer=true` messages
- [ ] No more "prepared statement already exists" errors
- [ ] Memory usage is under 2 GiB
- [ ] `/api/health` endpoint responds
- [ ] `/api/regions` returns data
- [ ] `/api/beaches` returns data

### Frontend

- [ ] Vercel deployment succeeds
- [ ] `NEXT_PUBLIC_API_URL` is set correctly
- [ ] Regions load on `/raid` page
- [ ] Beaches load on `/raid` page
- [ ] OAuth sign-in works (redirects to Cloud Run, not Fly.io)

## Expected Logs After Fix

### Backend (Cloud Run)

```
[prisma] ✅ Added pgbouncer=true for Supabase pooler (disables prepared statements)
[prisma] ✅ Using Supabase pooler with pgbouncer=true (prepared statements disabled)
[prisma] Connection URL (first 80 chars): postgresql://postgres.pffssccmdbopnlgjdhwh:...
[prisma] ✅ Verified: pgbouncer=true is in connection URL
```

### Frontend (Vercel)

- No more 503 errors
- Regions and beaches load correctly
- OAuth redirects to Cloud Run URL
