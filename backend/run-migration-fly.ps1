# PowerShell script to run Prisma migrations on Fly.io
# Usage: .\run-migration-fly.ps1

Write-Host "🚀 Running Prisma migration on Fly.io..." -ForegroundColor Cyan
Write-Host ""

# Run migration via SSH
fly ssh console -C "cd /app && npx prisma migrate deploy" --app tide-raider-backend

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Check the error above." -ForegroundColor Red
    exit $LASTEXITCODE
}


