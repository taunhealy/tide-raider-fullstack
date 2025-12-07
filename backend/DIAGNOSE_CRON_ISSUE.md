# Diagnosing Cron Job Execution Issue

## Problem Summary

From the logs, I can see:
1. ✅ Cron scheduler starts successfully: "Starting cron scheduler..."
2. ❌ Cloud Scheduler calls are failing: "Unauthorized cron attempt - invalid secret"
3. ❌ No successful cron job executions: No "Starting scheduled cron job..." messages

## Root Cause

The `CRON_SECRET` in Cloud Scheduler doesn't match the `CRON_SECRET` in Cloud Run environment variables.

## Solution Steps

### Step 1: Check Current CRON_SECRET in Cloud Run

```powershell
# Get the CRON_SECRET from Cloud Run
gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(spec.template.spec.containers[0].env[?name=='CRON_SECRET'].value)"
```

### Step 2: Check CRON_SECRET in Cloud Scheduler

```powershell
# Get the CRON_SECRET from Cloud Scheduler
gcloud scheduler jobs describe tide-raider-cron-4hourly --location=europe-west1 --format="value(httpTarget.headers.x-cron-secret)"
```

### Step 3: Update Cloud Scheduler to Match Cloud Run

If they don't match, update Cloud Scheduler:

```powershell
# First, get the correct secret from Cloud Run
$CRON_SECRET = gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(spec.template.spec.containers[0].env[?name=='CRON_SECRET'].value)"

# Then update Cloud Scheduler
gcloud scheduler jobs update http tide-raider-cron-4hourly `
  --location=europe-west1 `
  --headers="x-cron-secret=$CRON_SECRET"
```

### Step 4: Verify Cloud Scheduler Configuration

```powershell
# Check the full Cloud Scheduler job configuration
gcloud scheduler jobs describe tide-raider-cron-4hourly --location=europe-west1
```

Look for:
- `schedule`: Should be `0 2,20 * * *` (02:00 and 20:00 UTC)
- `httpTarget.uri`: Should point to your Cloud Run service
- `httpTarget.headers.x-cron-secret`: Should match Cloud Run's CRON_SECRET

### Step 5: Test Manually

After fixing, test manually:

```powershell
# Get the secret
$CRON_SECRET = gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(spec.template.spec.containers[0].env[?name=='CRON_SECRET'].value)"

# Get the Cloud Run URL
$BACKEND_URL = gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(status.url)"

# Test the endpoint
curl -X POST "$BACKEND_URL/api/cron/fetch-and-alert" `
  -H "Content-Type: application/json" `
  -H "x-cron-secret: $CRON_SECRET"
```

You should see:
- `🕐 Starting cron job for timezone: UTC`
- `✅ Cron job completed in Xms`

## Alternative: Check if Internal Cron is Disabled

The internal cron scheduler (node-cron) might be disabled in production. Check if `ENABLE_CRON` is set to `false`:

```powershell
gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(spec.template.spec.containers[0].env[?name=='ENABLE_CRON'].value)"
```

If it's `false` or not set, the internal cron won't run. In that case, you **must** use Cloud Scheduler, and the secret must match.

## Quick Fix Script

Run this to automatically fix the mismatch:

```powershell
# Get CRON_SECRET from Cloud Run
$CRON_SECRET = gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(spec.template.spec.containers[0].env[?name=='CRON_SECRET'].value)"

if ([string]::IsNullOrEmpty($CRON_SECRET)) {
    Write-Host "❌ CRON_SECRET not found in Cloud Run environment variables!" -ForegroundColor Red
    Write-Host "You need to set it first:" -ForegroundColor Yellow
    Write-Host 'gcloud run services update tide-raider-backend --region=europe-west1 --update-secrets=CRON_SECRET=CRON_SECRET:latest' -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Found CRON_SECRET in Cloud Run" -ForegroundColor Green

# Update Cloud Scheduler
Write-Host "Updating Cloud Scheduler with matching secret..." -ForegroundColor Yellow
gcloud scheduler jobs update http tide-raider-cron-4hourly `
  --location=europe-west1 `
  --headers="x-cron-secret=$CRON_SECRET"

Write-Host "✅ Cloud Scheduler updated!" -ForegroundColor Green
Write-Host "`nTest it manually:" -ForegroundColor Yellow
Write-Host "gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1" -ForegroundColor Cyan
```

