# Update DATABASE_URL secret to include ?pgbouncer=true
# This fixes the prepared statement error with PgBouncer

Write-Host "`n🔍 Checking current DATABASE_URL secret..." -ForegroundColor Cyan

# Get current secret value
$currentSecret = gcloud secrets versions access latest --secret="DATABASE_URL" --project=surf-445620 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Failed to retrieve secret" -ForegroundColor Red
    Write-Host "Error: $currentSecret" -ForegroundColor Yellow
    Write-Host "`nMake sure you have Secret Manager Secret Accessor role" -ForegroundColor Yellow
    Write-Host "Run: gcloud projects add-iam-policy-binding surf-445620 --member=user:YOUR_EMAIL --role=roles/secretmanager.secretAccessor" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n✅ Retrieved secret value" -ForegroundColor Green

# Check if pgbouncer=true already exists
if ($currentSecret -match "pgbouncer=true") {
    Write-Host "`n✅ Secret already has pgbouncer=true - no update needed!" -ForegroundColor Green
    Write-Host "`nCurrent format looks correct." -ForegroundColor Gray
    exit 0
}

Write-Host "`n⚠️ Secret does NOT have pgbouncer=true" -ForegroundColor Yellow
Write-Host "`nCurrent secret format: $($currentSecret.Substring(0, [Math]::Min(80, $currentSecret.Length)))..." -ForegroundColor Gray

# Add ?pgbouncer=true to the connection string
$updatedSecret = $currentSecret.Trim()

# Check if URL already has query parameters
if ($updatedSecret -match "\?") {
    # Has query params - append &pgbouncer=true
    if ($updatedSecret -notmatch "pgbouncer=") {
        $updatedSecret = $updatedSecret + "&" + "pgbouncer=true"
    }
} else {
    # No query params - add ?pgbouncer=true
    $updatedSecret = $updatedSecret + "?" + "pgbouncer=true"
}

Write-Host "`n📝 Creating new secret version with pgbouncer=true..." -ForegroundColor Yellow
Write-Host "Updated format: $($updatedSecret.Substring(0, [Math]::Min(80, $updatedSecret.Length)))..." -ForegroundColor Gray

# Create new secret version
$updatedSecret | gcloud secrets versions add DATABASE_URL --data-file=- --project=surf-445620

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully updated DATABASE_URL secret with pgbouncer=true!" -ForegroundColor Green
    Write-Host "`n⚠️ IMPORTANT: You need to restart Cloud Run service for the change to take effect" -ForegroundColor Yellow
    Write-Host "Run: gcloud run services update tide-raider-backend --region=us-central1 --project=surf-445620" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Failed to update secret" -ForegroundColor Red
    exit 1
}

