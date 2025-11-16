# PowerShell script for testing backend API on Windows
# Usage: .\test-api.ps1 [token]

param(
    [string]$Token = ""
)

$BaseUrl = "http://localhost:3001"

Write-Host "🧪 Testing Backend API" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Health check
Write-Host "1. Health Check:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    Write-Host "Status: $($response.status)" -ForegroundColor Green
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Beaches (public)
Write-Host "2. Get Beaches (public):" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/beaches" -Method Get
    $count = $response.beaches.Count
    Write-Host "Found beaches: $count" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Alerts (requires auth)
if ($Token) {
    Write-Host "3. Get Alerts (authenticated):" -ForegroundColor Yellow
    try {
        $headers = @{
            "Cookie" = "next-auth.session-token=$Token"
        }
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/alerts" -Method Get -Headers $headers
        $count = $response.Count
        Write-Host "Found alerts: $count" -ForegroundColor Green
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "3. Get Alerts (skipped - no token provided)" -ForegroundColor Gray
    Write-Host "   Usage: .\test-api.ps1 -Token YOUR_SESSION_TOKEN" -ForegroundColor Gray
}
Write-Host ""

Write-Host "✅ Testing complete!" -ForegroundColor Green

