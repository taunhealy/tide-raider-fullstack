# Manual Fly.io Secrets Setup
# Copy and paste these commands one by one, replacing the values

$app = "tide-raider-backend"

Write-Host "Setting Fly.io secrets for: $app" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these commands one by one:" -ForegroundColor Yellow
Write-Host ""

Write-Host "# 1. DATABASE_URL" -ForegroundColor Green
Write-Host "flyctl secrets set DATABASE_URL=`"your-postgresql-connection-string`" --app $app" -ForegroundColor White
Write-Host ""

Write-Host "# 2. NEXTAUTH_SECRET" -ForegroundColor Green
Write-Host "flyctl secrets set NEXTAUTH_SECRET=`"your-nextauth-secret`" --app $app" -ForegroundColor White
Write-Host ""

Write-Host "# 3. FRONTEND_URL" -ForegroundColor Green
Write-Host "flyctl secrets set FRONTEND_URL=`"https://your-frontend.vercel.app`" --app $app" -ForegroundColor White
Write-Host ""

Write-Host "# 4. CRON_SECRET" -ForegroundColor Green
Write-Host "flyctl secrets set CRON_SECRET=`"your-cron-secret`" --app $app" -ForegroundColor White
Write-Host ""

Write-Host "# 5. NODE_ENV" -ForegroundColor Green
Write-Host "flyctl secrets set NODE_ENV=`"production`" --app $app" -ForegroundColor White
Write-Host ""

Write-Host "After setting all secrets, verify with:" -ForegroundColor Cyan
Write-Host "flyctl secrets list --app $app" -ForegroundColor White

