# Script to update DATABASE_URL for local Docker Postgres
# Run this from the backend directory

$envFile = ".env"
$localDbUrl = 'DATABASE_URL="postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev?schema=public"'
$productionDbUrl = 'DATABASE_URL="postgresql://fly-user:CgTmIxiwjbinc22DO8GYUAV5@pgbouncer.vmkq6098l4pr35ln.flympg.net/fly-db"'

if (Test-Path $envFile) {
    Write-Host "Updating $envFile..." -ForegroundColor Yellow
    
    # Read the file
    $content = Get-Content $envFile -Raw
    
    # Replace production URL with local Docker URL
    $content = $content -replace [regex]::Escape($productionDbUrl), "# Production (commented out)`n# $productionDbUrl`n$localDbUrl"
    
    # If DATABASE_URL doesn't exist, add it
    if ($content -notmatch 'DATABASE_URL=') {
        $content = "DATABASE_URL=$localDbUrl`n`n" + $content
    }
    
    # Write back to file
    Set-Content -Path $envFile -Value $content -NoNewline
    
    Write-Host "✅ Updated DATABASE_URL to use local Docker Postgres" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure Docker Desktop is running" -ForegroundColor White
    Write-Host "2. Run: npm run db:start" -ForegroundColor White
    Write-Host "3. Run: npm run prisma:migrate" -ForegroundColor White
} else {
    Write-Host "❌ .env file not found. Creating new one..." -ForegroundColor Red
    $content = @"
# Local Docker Postgres (for development)
$localDbUrl

# Production (commented out)
# $productionDbUrl

NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
"@
    Set-Content -Path $envFile -Value $content
    Write-Host "✅ Created .env file with local Docker Postgres URL" -ForegroundColor Green
}

