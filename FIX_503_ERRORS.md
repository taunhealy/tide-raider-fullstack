# Fixing 503 Service Unavailable Errors

## Problem
The Cloud Run backend is returning **503 Service Unavailable** errors, which means:
- Backend is not responding
- Backend is crashing on startup
- Backend is timing out
- Database connection issues

## Immediate Actions

### 1. Check Cloud Run Logs
**Direct Link**: https://console.cloud.google.com/run/detail/us-central1/tide-raider-backend/logs?project=surf-445620

Look for:
- `DATABASE_URL is not set!`
- `P1001: Can't reach database server`
- `PrismaClientInitializationError`
- `Error: Failed to run sql query`
- Crash logs or stack traces

### 2. Verify DATABASE_URL Secret
1. Go to: https://console.cloud.google.com/run/detail/us-central1/tide-raider-backend?project=surf-445620
2. Click "EDIT & DEPLOY NEW REVISION"
3. Go to "Variables & Secrets" tab
4. Verify `DATABASE_URL` is listed under "Secrets"
5. It should reference: `DATABASE_URL:latest`

### 3. Test Backend Directly
```powershell
# Test if backend is responding
Invoke-RestMethod -Uri "https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/health"
```

### 4. Check Database Connection
The backend needs the **Supabase pooler URL** (port 6543) with `?pgbouncer=true`:
```
postgresql://postgres.pffssccmdbopnlgjdhwh:Rgbalpha123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Common Issues

### Issue 1: DATABASE_URL Not Set
**Symptom**: Backend crashes on startup with "DATABASE_URL is not set"
**Fix**: 
1. Go to Google Secret Manager
2. Verify `DATABASE_URL` secret exists
3. Update Cloud Run service to reference the secret

### Issue 2: Wrong Connection String
**Symptom**: `P1001: Can't reach database server`
**Fix**: 
- Use pooler URL (port 6543) for Cloud Run
- Add `?pgbouncer=true` parameter
- Verify Supabase database is active (not paused)

### Issue 3: Backend Timeout
**Symptom**: 503 after 8-9 seconds
**Fix**:
- Check Cloud Run timeout settings (should be 300s)
- Check database query performance
- Verify connection pool settings

## Quick Diagnostic Commands

```powershell
# 1. Test backend health
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/health

# 2. Test regions endpoint
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/regions

# 3. View recent errors in Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND severity>=ERROR" --limit 20 --project surf-445620
```

## Next Steps
1. ✅ Check Cloud Run logs (use link above)
2. ✅ Verify DATABASE_URL secret is set correctly
3. ✅ Test backend endpoints directly
4. ✅ Check if database is paused in Supabase
5. ✅ Verify connection string uses pooler (port 6543)

