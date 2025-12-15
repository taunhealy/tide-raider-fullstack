# Cloud Scheduler Setup Script for Tide Raider (PowerShell)
# This script sets up Google Cloud Scheduler to trigger your Cloud Run backend daily at 3 AM SAST

$ErrorActionPreference = "Stop"

Write-Host "🌊 Tide Raider - Cloud Scheduler Setup" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ gcloud CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Get project ID
try {
    $PROJECT_ID = gcloud config get-value project 2>$null
} catch {
    $PROJECT_ID = $null
}

if (-not $PROJECT_ID) {
    Write-Host "❌ No GCP project selected. Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Project ID: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Prompt for required values
$BACKEND_URL = Read-Host "Enter your Cloud Run backend URL (e.g. https://tide-raider-backend-xxx.run.app)"
if ([string]::IsNullOrWhiteSpace($BACKEND_URL)) {
    Write-Error "Backend URL cannot be empty."
    exit 1
}

$CRON_SECRET = Read-Host "Enter your CRON_SECRET" -AsSecureString
# Convert SecureString to Plain Text safely
$ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToGlobalAllocUnicode($CRON_SECRET)
try {
    $CRON_SECRET_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringUni($ptr)
} finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeGlobalAllocUnicode($ptr)
}

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
& gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID

Write-Host ""
Write-Host "Step 2/5: Creating service account..." -ForegroundColor Yellow
$serviceAccountEmail = "cloud-scheduler-invoker@$PROJECT_ID.iam.gserviceaccount.com"
$saExists = $false
try {
    & gcloud iam service-accounts describe $serviceAccountEmail 2>$null | Out-Null
    $saExists = $true
} catch {
    $saExists = $false
}

if ($saExists) {
    Write-Host "   ℹ️  Service account already exists, skipping..." -ForegroundColor Gray
} else {
    & gcloud iam service-accounts create cloud-scheduler-invoker `
        --display-name="Cloud Scheduler Invoker" `
        --project=$PROJECT_ID
    Write-Host "   ✅ Service account created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3/5: Granting Cloud Run invoker permission..." -ForegroundColor Yellow
# Extract service name from URL
$SERVICE_NAME = $BACKEND_URL -replace 'https://', '' -replace '\..*', '' -replace '-\d+$', ''
Write-Host "   Detected service name: $SERVICE_NAME" -ForegroundColor Gray

& gcloud run services add-iam-policy-binding $SERVICE_NAME `
    --member="serviceAccount:$serviceAccountEmail" `
    --role="roles/run.invoker" `
    --region=$REGION `
    --project=$PROJECT_ID

Write-Host ""
Write-Host "Step 4/5: Managing Cloud Scheduler jobs..." -ForegroundColor Yellow

# Check for old job
$jobOldExists = $false
try {
    & gcloud scheduler jobs describe tide-raider-cron-4hourly --location=$REGION 2>$null | Out-Null
    $jobOldExists = $true
} catch {
    $jobOldExists = $false
}

if ($jobOldExists) {
    Write-Host "   ⚠️  Found old 4-hourly job. Deleting..." -ForegroundColor Yellow
    & gcloud scheduler jobs delete tide-raider-cron-4hourly --location=$REGION --quiet
    Write-Host "   ✅ Old job deleted" -ForegroundColor Green
}

# Create or update new job
$jobExists = $false
try {
    & gcloud scheduler jobs describe tide-raider-cron-daily-3am --location=$REGION 2>$null | Out-Null
    $jobExists = $true
} catch {
    $jobExists = $false
}

# Construct args carefully to avoid parsing issues
$commonArgs = @(
    "--location=$REGION",
    "--schedule=0 3 * * *",
    "--uri=$BACKEND_URL/api/cron/run-now",
    "--http-method=POST",
    "--headers=Content-Type=application/json,x-cron-secret=$CRON_SECRET_PLAIN",
    "--oidc-service-account-email=$serviceAccountEmail",
    "--oidc-token-audience=$BACKEND_URL",
    "--time-zone=Africa/Johannesburg",
    "--attempt-deadline=1800s",
    "--max-retry-attempts=2",
    "--project=$PROJECT_ID"
)

try {
    if ($jobExists) {
        Write-Host "   ℹ️  Job already exists. Updating..." -ForegroundColor Gray
        $updateArgs = @("scheduler", "jobs", "update", "http", "tide-raider-cron-daily-3am") + $commonArgs
        & gcloud $updateArgs
    } else {
        $createArgs = @("scheduler", "jobs", "create", "http", "tide-raider-cron-daily-3am", "--description=Fetch surf forecasts and process alerts daily at 3 AM SAST") + $commonArgs
        & gcloud $createArgs
    }
} catch {
    Write-Error "Failed to update/create scheduler job. See above error."
    exit 1
}

Write-Host ""
Write-Host "Step 5/5: Testing the job..." -ForegroundColor Yellow
$testRun = Read-Host "Run a test execution now? (y/n)"
if ($testRun -eq 'y' -or $testRun -eq 'Y') {
    Write-Host "   🚀 Triggering test run..." -ForegroundColor Cyan
    & gcloud scheduler jobs run tide-raider-cron-daily-3am --location=$REGION --project=$PROJECT_ID
    
    Write-Host ""
    Write-Host "   ⏳ Waiting for execution (this may take 1-2 minutes)..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "   📊 Recent execution status:" -ForegroundColor Cyan
    & gcloud scheduler jobs describe tide-raider-cron-daily-3am --location=$REGION --project=$PROJECT_ID --format="table(state, lastAttemptTime, status.code, status.message)"
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📅 Schedule: Daily at 03:00 SAST (01:00 UTC)" -ForegroundColor Cyan
Write-Host "💰 Estimated cost: ~`$1.10/month" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Yellow
Write-Host "   List jobs:    gcloud scheduler jobs list --location=$REGION"
Write-Host "   Run manually: gcloud scheduler jobs run tide-raider-cron-daily-3am --location=$REGION"
Write-Host "   View logs:    gcloud scheduler jobs describe tide-raider-cron-daily-3am --location=$REGION"
Write-Host "   Pause job:    gcloud scheduler jobs pause tide-raider-cron-daily-3am --location=$REGION"
Write-Host "   Resume job:   gcloud scheduler jobs resume tide-raider-cron-daily-3am --location=$REGION"
Write-Host ""
Write-Host "🎉 Your backend will now run on-demand only when needed!" -ForegroundColor Green
Write-Host ""
