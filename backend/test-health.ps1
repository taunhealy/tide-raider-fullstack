# Test backend health endpoint in PowerShell
# Usage: .\test-health.ps1

$url = "http://localhost:3001/health"

Write-Host "Testing backend health endpoint..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ ERROR: Could not connect to backend" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Backend server is not running" -ForegroundColor Gray
    Write-Host "2. Backend is running on a different port" -ForegroundColor Gray
    Write-Host "3. Firewall is blocking the connection" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
}

