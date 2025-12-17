# Cloud Scheduler WEEKLY JOB Setup (PowerShell)

Write-Host "🌊 Tide Raider - Weekly Web Scrape Setup"
Write-Host "=========================================="
Write-Host ""

$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Host "❌ No GCP project selected."
    exit 1
}

Write-Host "📋 Project ID: $PROJECT_ID"
Write-Host ""

$BACKEND_URL = Read-Host "Enter your Cloud Run backend URL"
$CRON_SECRET = Read-Host "Enter your CRON_SECRET" -AsSecureString
# Convert SecureString to plain text for gcloud command
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($CRON_SECRET)
$CRON_SECRET_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$REGION = Read-Host "Enter Cloud Run region (default: europe-west1)"
if (-not $REGION) { $REGION = "europe-west1" }

Write-Host ""
Write-Host "Step 1: Creating/Updating Weekly Scheduler job..."

$JOB_NAME = "tide-raider-cron-weekly-3am"
$SERVICE_ACCOUNT = "cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if job exists
$jobExists = gcloud scheduler jobs describe $JOB_NAME --location=$REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ℹ️  Job already exists. Updating..."
    gcloud scheduler jobs update http $JOB_NAME `
        --location=$REGION `
        --schedule="0 3 * * 1" `
        --uri="${BACKEND_URL}/api/cron/run-weekly" `
        --http-method=POST `
        --headers="Content-Type=application/json,x-cron-secret=${CRON_SECRET_PLAIN}" `
        --oidc-service-account-email=$SERVICE_ACCOUNT `
        --oidc-token-audience="${BACKEND_URL}" `
        --time-zone="Africa/Johannesburg" `
        --attempt-deadline=1800s `
        --max-retry-attempts=2 `
        --project=$PROJECT_ID
} else {
    gcloud scheduler jobs create http $JOB_NAME `
        --location=$REGION `
        --schedule="0 3 * * 1" `
        --uri="${BACKEND_URL}/api/cron/run-weekly" `
        --http-method=POST `
        --headers="Content-Type=application/json,x-cron-secret=${CRON_SECRET_PLAIN}" `
        --oidc-service-account-email=$SERVICE_ACCOUNT `
        --oidc-token-audience="${BACKEND_URL}" `
        --time-zone="Africa/Johannesburg" `
        --attempt-deadline=1800s `
        --max-retry-attempts=2 `
        --description="Fetch FULL WEEK surf forecasts weekly at 3 AM SAST Mondays" `
        --project=$PROJECT_ID
}

Write-Host ""
Write-Host "✅ Weekly job setup complete!"
Write-Host "📅 Schedule: Mondays at 03:00 SAST"
