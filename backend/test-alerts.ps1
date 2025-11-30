#!/usr/bin/env pwsh
# Test Alert Processing
# This script triggers the cron job on Cloud Run to process alerts and send notifications

$BACKEND_URL = "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app"
$CRON_SECRET = $env:CRON_SECRET

if (-not $CRON_SECRET) {
    Write-Host "❌ CRON_SECRET environment variable not set" -ForegroundColor Red
    Write-Host "Set it with: `$env:CRON_SECRET = 'your-secret-from-.env'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Triggering cron job on Cloud Run..." -ForegroundColor Cyan
Write-Host "Backend: $BACKEND_URL" -ForegroundColor Gray

$headers = @{
    "Content-Type" = "application/json"
    "X-Cron-Secret" = $CRON_SECRET
}

$body = @{
    timezone = "Africa/Johannesburg"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "$BACKEND_URL/api/cron/fetch-and-alert" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 300

    Write-Host "✅ Cron job completed successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "❌ Error triggering cron job:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseText = $reader.ReadToEnd()
        Write-Host "Response: $responseText" -ForegroundColor Yellow
    }
    exit 1
}
