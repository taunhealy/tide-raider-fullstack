# Cloud Scheduler WEEKLY JOB Setup (PowerShell)

Write-Host "🌊 Tide Raider - Weekly Web Scrape Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ gcloud CLI not found." -ForegroundColor Red
    exit 1
}

$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Host "❌ No GCP project selected." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Project ID: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

$BACKEND_URL = Read-Host "Enter your Cloud Run backend URL"
$CRON_SECRET = Read-Host "Enter your CRON_SECRET" -AsSecureString
# Convert SecureString to plain text for gcloud command
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($CRON_SECRET)
$CRON_SECRET_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$REGION = Read-Host "Enter Cloud Run region (default: europe-west1)"
if (-not $REGION) { $REGION = "europe-west1" }

Write-Host ""
Write-Host "Step 1: Creating/Updating Weekly Scheduler job..." -ForegroundColor Yellow

$JOB_NAME = "tide-raider-cron-weekly-3am"
$SERVICE_ACCOUNT = "cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com"

# Check if job exists
$jobExists = $false
try {
    gcloud scheduler jobs describe $JOB_NAME --location=$REGION 2>$null | Out-Null
    $jobExists = $true
} catch {
    $jobExists = $false
}

$commonArgs = @(
    "--location=$REGION",
    "--schedule=0 3 * * 1",
    "--uri=${BACKEND_URL}/api/cron/run-weekly",
    "--http-method=POST",
    "--headers=Content-Type=application/json,x-cron-secret=${CRON_SECRET_PLAIN}",
    "--oidc-service-account-email=$SERVICE_ACCOUNT",
    "--oidc-token-audience=${BACKEND_URL}",
    "--time-zone=Africa/Johannesburg",
    "--attempt-deadline=1800s",
    "--max-retry-attempts=2",
    "--project=$PROJECT_ID"
)

try {
    if ($jobExists) {
        Write-Host "   ℹ️  Job already exists. Updating..." -ForegroundColor Gray
        $updateArgs = @("scheduler", "jobs", "update", "http", $JOB_NAME) + $commonArgs
        & gcloud @updateArgs
    } else {
        $createArgs = @("scheduler", "jobs", "create", "http", $JOB_NAME, "--description=Fetch FULL WEEK surf forecasts weekly at 3 AM SAST Mondays") + $commonArgs
        & gcloud @createArgs
    }
} catch {
    Write-Error "Failed to create/update weekly job"
    exit 1
}

Write-Host ""
Write-Host "✅ Weekly job setup complete!" -ForegroundColor Green
Write-Host "📅 Schedule: Mondays at 03:00 SAST" -ForegroundColor Cyan
