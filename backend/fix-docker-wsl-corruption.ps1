# Script to completely remove corrupted Docker WSL2 distributions
# Run PowerShell as Administrator

Write-Host "🔧 Fixing Corrupted Docker WSL2 Distributions" -ForegroundColor Cyan
Write-Host ""

# Step 1: Force shutdown WSL2
Write-Host "Step 1: Shutting down WSL2..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5

# Step 2: List all WSL distributions
Write-Host "Step 2: Listing WSL distributions..." -ForegroundColor Yellow
wsl --list --verbose

# Step 3: Unregister Docker distributions
Write-Host "Step 3: Removing Docker WSL2 distributions..." -ForegroundColor Yellow

$distros = @("docker-desktop", "docker-desktop-data")

foreach ($distro in $distros) {
    Write-Host "  Attempting to unregister: $distro" -ForegroundColor White
    try {
        wsl --unregister $distro 2>&1 | Out-Null
        Write-Host "  ✅ Removed: $distro" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Could not remove $distro (may not exist)" -ForegroundColor Yellow
    }
}

# Step 4: Stop Docker Desktop processes
Write-Host "Step 4: Stopping Docker processes..." -ForegroundColor Yellow
Get-Process | Where-Object { 
    $_.ProcessName -like "*docker*" -or 
    $_.ProcessName -like "*com.docker*" 
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 3

# Step 5: Final WSL shutdown
Write-Host "Step 5: Final WSL2 shutdown..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Docker Desktop" -ForegroundColor White
Write-Host "2. Go to Settings → General" -ForegroundColor White
Write-Host "3. UNCHECK 'Use the WSL 2 based engine'" -ForegroundColor Yellow
Write-Host "4. Click 'Apply & Restart'" -ForegroundColor White
Write-Host "5. Wait for Docker to restart with Hyper-V backend" -ForegroundColor White
Write-Host ""
Write-Host "This will avoid WSL2 issues completely!" -ForegroundColor Green

