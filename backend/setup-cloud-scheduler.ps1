# Cloud Scheduler Setup Script for Tide Raider (PowerShell)
# This script sets up Google Cloud Scheduler to trigger your Cloud Run backend every 4 hours

Write-Host "🌊 Tide Raider - Cloud Scheduler Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $null = gcloud --version 2>&1
} catch {
    Write-Host "❌ gcloud CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Get project ID
$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Host "❌ No GCP project selected. Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Project ID: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Prompt for required values
$BACKEND_URL = Read-Host "Enter your Cloud Run backend URL (e.g., https://tide-raider-backend-xxx.run.app)"
$CRON_SECRET = Read-Host "Enter your CRON_SECRET" -AsSecureString
$CRON_SECRET_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($CRON_SECRET))
$REGION = Read-Host "Enter Cloud Run region (default: europe-west1)"
if (-not $REGION) { $REGION = "europe-west1" }

Write-Host ""
Write-Host "🔧 Configuration:" -ForegroundColor Cyan
Write-Host "   Backend URL: $BACKEND_URL"
Write-Host "   Region: $REGION"
Write-Host "   Project: $PROJECT_ID"
Write-Host ""

$confirm = Read-Host "Continue with setup? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Setup cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1/5: Enabling Cloud Scheduler API..." -ForegroundColor Yellow
gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID

Write-Host ""
Write-Host "Step 2/5: Creating service account..." -ForegroundColor Yellow
$serviceAccountEmail = "cloud-scheduler-invoker@$PROJECT_ID.iam.gserviceaccount.com"
$saExists = gcloud iam service-accounts describe $serviceAccountEmail 2>$null
if ($saExists) {
    Write-Host "   ℹ️  Service account already exists, skipping..." -ForegroundColor Gray
} else {
    gcloud iam service-accounts create cloud-scheduler-invoker `
        --display-name="Cloud Scheduler Invoker" `
        --project=$PROJECT_ID
    Write-Host "   ✅ Service account created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3/5: Granting Cloud Run invoker permission..." -ForegroundColor Yellow
# Extract service name from URL
$SERVICE_NAME = $BACKEND_URL -replace 'https://', '' -replace '\..*', '' -replace '-\d+$', ''
Write-Host "   Detected service name: $SERVICE_NAME" -ForegroundColor Gray

gcloud run services add-iam-policy-binding $SERVICE_NAME `
    --member="serviceAccount:$serviceAccountEmail" `
    --role="roles/run.invoker" `
    --region=$REGION `
    --project=$PROJECT_ID

Write-Host ""
Write-Host "Step 4/5: Creating Cloud Scheduler job..." -ForegroundColor Yellow
$jobExists = gcloud scheduler jobs describe tide-raider-cron-4hourly --location=$REGION 2>$null
if ($jobExists) {
    Write-Host "   ℹ️  Job already exists. Updating..." -ForegroundColor Gray
    gcloud scheduler jobs update http tide-raider-cron-4hourly `
        --location=$REGION `
        --schedule="0 */4 * * *" `
        --uri="$BACKEND_URL/api/cron/run-now" `
        --http-method=POST `
        --headers="Content-Type=application/json,x-cron-secret=$CRON_SECRET_PLAIN" `
        --oidc-service-account-email=$serviceAccountEmail `
        --oidc-token-audience=$BACKEND_URL `
        --time-zone="UTC" `
        --attempt-deadline=600s `
        --max-retry-attempts=2 `
        --project=$PROJECT_ID
} else {
    gcloud scheduler jobs create http tide-raider-cron-4hourly `
        --location=$REGION `
        --schedule="0 */4 * * *" `
        --uri="$BACKEND_URL/api/cron/run-now" `
        --http-method=POST `
        --headers="Content-Type=application/json,x-cron-secret=$CRON_SECRET_PLAIN" `
        --oidc-service-account-email=$serviceAccountEmail `
        --oidc-token-audience=$BACKEND_URL `
        --time-zone="UTC" `
        --attempt-deadline=600s `
        --max-retry-attempts=2 `
        --description="Fetch surf forecasts and process alerts every 4 hours" `
        --project=$PROJECT_ID
}

Write-Host ""
Write-Host "Step 5/5: Testing the job..." -ForegroundColor Yellow
$testRun = Read-Host "Run a test execution now? (y/n)"
if ($testRun -eq 'y' -or $testRun -eq 'Y') {
    Write-Host "   🚀 Triggering test run..." -ForegroundColor Cyan
    gcloud scheduler jobs run tide-raider-cron-4hourly --location=$REGION --project=$PROJECT_ID
    Write-Host ""
    Write-Host "   ⏳ Waiting for execution (this may take 1-2 minutes)..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    Write-Host ""
    Write-Host "   📊 Recent execution status:" -ForegroundColor Cyan
    gcloud scheduler jobs describe tide-raider-cron-4hourly `
        --location=$REGION `
        --project=$PROJECT_ID `
        --format="table(state, lastAttemptTime, status.code, status.message)"
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📅 Schedule: Every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)" -ForegroundColor Cyan
Write-Host "💰 Estimated cost: ~`$1.10/month (97% savings vs 24/7!)" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Yellow
Write-Host "   List jobs:    gcloud scheduler jobs list --location=$REGION"
Write-Host "   Run manually: gcloud scheduler jobs run tide-raider-cron-4hourly --location=$REGION"
Write-Host "   View logs:    gcloud scheduler jobs describe tide-raider-cron-4hourly --location=$REGION"
Write-Host "   Pause job:    gcloud scheduler jobs pause tide-raider-cron-4hourly --location=$REGION"
Write-Host "   Resume job:   gcloud scheduler jobs resume tide-raider-cron-4hourly --location=$REGION"
Write-Host ""
Write-Host "🎉 Your backend will now run on-demand only when needed!" -ForegroundColor Green
Write-Host ""
