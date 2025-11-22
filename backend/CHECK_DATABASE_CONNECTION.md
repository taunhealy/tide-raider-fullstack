# Check Database Connection and Data

## Quick Checks

### 1. Verify Database Has Data

**Option A: Check Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/pffssccmdbopnlgjdhwh
2. Navigate to **Table Editor**
3. Check if you see data in:
   - `Continent` table
   - `Country` table
   - `Region` table
   - `Beach` table

**Option B: Query via API**
```bash
# Test if backend can connect to database
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/beaches

# Should return beaches array (even if empty)
# If 500 error, database connection issue
```

### 2. Check Cloud Run Logs

1. Go to: https://console.cloud.google.com/run?project=surf-445620
2. Click on `tide-raider-backend` service
3. Go to **Logs** tab
4. Look for:
   - Database connection errors
   - Prisma errors
   - Seed completion messages
   - Any 500 errors

### 3. Verify DATABASE_URL in Cloud Run

1. Go to Cloud Run service
2. Click **Edit & Deploy New Revision**
3. Check **Variables & Secrets** tab
4. Verify `DATABASE_URL` secret is set and points to Supabase

**Should be:**
```
postgresql://postgres.pffssccmdbopnlgjdhwh:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 4. Test Database Connection Directly

If you have the Supabase password, test locally:

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.pffssccmdbopnlgjdhwh.supabase.co:5432/postgres"

# Test connection
cd backend
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Continent\";"
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Beach\";"
```

## Common Issues

### Issue: Database has no data
**Solution:** Run seed again:
```bash
curl -X POST https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/seed
```

### Issue: Backend returns 500 errors
**Possible causes:**
1. DATABASE_URL not set in Cloud Run secrets
2. Wrong DATABASE_URL format
3. Supabase database paused
4. Connection pool exhausted

**Fix:**
1. Check Cloud Run secrets
2. Verify Supabase is active (not paused)
3. Check Cloud Run logs for specific error

### Issue: "Can't reach database server"
**Fix:**
- Verify Supabase database is active
- Check DATABASE_URL is correct
- For Cloud Run, use pooler connection (port 6543)

## Next Steps

1. **If database has no data:** Run seed endpoint
2. **If backend returns 500:** Check Cloud Run logs
3. **If connection fails:** Verify DATABASE_URL secret

