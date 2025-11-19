# Script to force shutdown WSL2 and fix locked Docker disk
# Run this as Administrator

Write-Host "🔧 Fixing Docker WSL2 Locked Disk Issue" -ForegroundColor Cyan
Write-Host ""

# Step 1: Force shutdown WSL2
Write-Host "Step 1: Forcing WSL2 shutdown..." -ForegroundColor Yellow
wsl --shutdown

# Wait a moment
Start-Sleep -Seconds 5

# Step 2: Check if Docker processes are still running
Write-Host "Step 2: Checking for Docker processes..." -ForegroundColor Yellow
$dockerProcesses = Get-Process | Where-Object { $_.ProcessName -like "*docker*" -or $_.ProcessName -like "*com.docker*" }

if ($dockerProcesses) {
    Write-Host "Found Docker processes still running. Stopping them..." -ForegroundColor Red
    $dockerProcesses | Stop-Process -Force
    Start-Sleep -Seconds 3
} else {
    Write-Host "✅ No Docker processes found" -ForegroundColor Green
}

# Step 3: Try to shutdown WSL2 again
Write-Host "Step 3: Shutting down WSL2 again..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5

# Step 4: Check WSL status
Write-Host "Step 4: Checking WSL status..." -ForegroundColor Yellow
wsl --list --verbose

Write-Host ""
Write-Host "✅ Done! Now try these steps:" -ForegroundColor Green
Write-Host "1. Restart Docker Desktop" -ForegroundColor White
Write-Host "2. Wait for it to fully start" -ForegroundColor White
Write-Host "3. Run: npm run db:start" -ForegroundColor White
Write-Host ""
Write-Host "If it still fails, you may need to:" -ForegroundColor Yellow
Write-Host "- Switch Docker Desktop to Hyper-V backend (Settings → General → Uncheck WSL2)" -ForegroundColor White
Write-Host "- Or restart your computer" -ForegroundColor White

