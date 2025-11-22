# Viewing Cloud Run Backend Logs

## Method 1: Google Cloud Console (Easiest)

1. **Go to Cloud Run Console**:
   - https://console.cloud.google.com/run?project=surf-445620
   - Or: https://console.cloud.google.com/run/detail/us-central1/tide-raider-backend/logs?project=surf-445620

2. **Select your service**: `tide-raider-backend`

3. **Click "LOGS" tab** at the top

4. **Filter logs**:
   - Use the search box to filter by keywords like:
     - `[regions]` - Region endpoint logs
     - `[beaches]` - Beach endpoint logs
     - `[prisma]` - Database connection logs
     - `Error` - All errors
     - `DATABASE_URL` - Database connection issues

5. **View real-time logs**: Logs update automatically

## Method 2: gcloud CLI (Command Line)

### View recent logs:
```powershell
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend" --limit 50 --format json --project surf-445620
```

### View logs with filters:
```powershell
# All logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend" --limit 100 --project surf-445620

# Only errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND severity>=ERROR" --limit 50 --project surf-445620

# Database connection logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND (textPayload=~'DATABASE_URL' OR textPayload=~'prisma' OR textPayload=~'P1001')" --limit 50 --project surf-445620

# Region endpoint logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND textPayload=~'regions'" --limit 50 --project surf-445620
```

### Stream logs in real-time:
```powershell
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend" --project surf-445620
```

## Method 3: Check Backend Health Endpoint

Test if the backend is responding:

```powershell
# Check if backend is up
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/health

# Test regions endpoint
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/regions

# Test beaches endpoint
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/beaches
```

## Common Issues to Look For:

### 1. Database Connection Errors:
- Look for: `P1001: Can't reach database server`
- Look for: `PrismaClientInitializationError`
- Look for: `DATABASE_URL` in error messages

### 2. Missing Environment Variables:
- Look for: `DATABASE_URL is not set`
- Look for: `Missing required environment variable`

### 3. CORS Errors:
- Look for: `CORS` or `Access-Control-Allow-Origin`

### 4. Route Not Found:
- Look for: `404` or `Route not found`

## Quick Diagnostic Commands:

```powershell
# 1. Check if backend is running
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/health

# 2. Test regions endpoint
curl https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/regions

# 3. View recent errors
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND severity>=ERROR" --limit 20 --project surf-445620 --format="table(timestamp,textPayload)"

# 4. Check database connection logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend AND (textPayload=~'DATABASE' OR textPayload=~'prisma' OR textPayload=~'P1001')" --limit 20 --project surf-445620
```

## Verify DATABASE_URL Secret:

```powershell
# Check if DATABASE_URL secret exists
gcloud secrets list --project surf-445620 | Select-String "DATABASE_URL"

# View secret metadata (not the value)
gcloud secrets describe DATABASE_URL --project surf-445620
```

