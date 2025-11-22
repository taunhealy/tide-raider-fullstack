# Quick Commands to View Cloud Run Logs

## Option 1: Google Cloud Console (Easiest - No CLI needed)

**Direct Link**: https://console.cloud.google.com/run/detail/us-central1/tide-raider-backend/logs?project=surf-445620

1. Click the link above
2. You'll see real-time logs
3. Use the search box to filter:
   - `[regions]` - Region endpoint logs
   - `[beaches]` - Beach endpoint logs  
   - `Error` - All errors
   - `DATABASE_URL` - Database connection issues
   - `P1001` - Database connection errors

## Option 2: gcloud CLI Commands

### View Recent Logs (Last 50):
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend" --limit 50 --project surf-445620
```

### View Only Errors:
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND severity>=ERROR" --limit 50 --project surf-445620
```

### View Database Connection Errors:
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND (textPayload=~'DATABASE' OR textPayload=~'P1001' OR textPayload=~'prisma')" --limit 50 --project surf-445620
```

### View Region Endpoint Logs:
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND textPayload=~'regions'" --limit 50 --project surf-445620
```

### Stream Logs in Real-Time:
```powershell
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend" --project surf-445620
```

## Option 3: Test Backend Directly

### Test Health Endpoint:
```powershell
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/health
```

### Test Regions Endpoint:
```powershell
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/regions
```

### Test Beaches Endpoint:
```powershell
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/beaches
```

## What to Look For:

### Database Connection Issues:
- `P1001: Can't reach database server`
- `PrismaClientInitializationError`
- `DATABASE_URL is not set`
- `Can't reach database server at db.pffssccmdbopnlgjdhwh.supabase.co`

### Missing Environment Variables:
- `DATABASE_URL environment variable is not set!`
- `Missing required environment variable: DATABASE_URL`

### Route Errors:
- `404` - Route not found
- `500` - Server error
- `[regions] Database unavailable, returning empty array`

## Quick Fix Checklist:

1. ✅ Check Cloud Run logs (use link above)
2. ✅ Verify DATABASE_URL secret exists in Cloud Run
3. ✅ Test backend endpoints directly
4. ✅ Check if backend is returning empty arrays (database connection issue)

