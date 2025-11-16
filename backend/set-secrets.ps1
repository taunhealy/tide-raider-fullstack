# Fly.io Secrets Setup Script
# Run this script to set all required secrets for your backend deployment

param(
    [string]$AppName = "tide-raider-backend"
)

Write-Host "🔐 Setting Fly.io Secrets for: $AppName" -ForegroundColor Cyan
Write-Host ""

# Check if flyctl is available
try {
    $null = flyctl version 2>&1
} catch {
    Write-Host "❌ flyctl not found. Please install Fly CLI first." -ForegroundColor Red
    Write-Host "Run: powershell -Command 'iwr https://fly.io/install.ps1 -useb | iex'" -ForegroundColor Yellow
    exit 1
}

# Required secrets
$secrets = @{
    "DATABASE_URL" = 'PostgreSQL connection string'
    "NEXTAUTH_SECRET" = 'NextAuth secret key - must match frontend'
    "FRONTEND_URL" = 'Frontend URL for CORS'
    "CRON_SECRET" = 'Secret key for cron job authentication'
    "NODE_ENV" = "production"
}

# Optional secrets
$optionalSecrets = @{
    "RESEND_API_KEY" = 'Resend API key for email notifications'
    "MESSAGEBIRD_API_KEY" = 'MessageBird API key for WhatsApp'
    "MESSAGEBIRD_WORKSPACE_ID" = 'MessageBird workspace ID'
    "UNIPILE_API_KEY" = 'Unipile API key for WhatsApp'
    "WASENDER_API_KEY" = 'WaSender API key'
    "WASENDER_API_URL" = 'WaSender API URL'
    "AWS_ACCESS_KEY_ID" = 'AWS access key - if using S3'
    "AWS_SECRET_ACCESS_KEY" = 'AWS secret key'
    "AWS_REGION" = 'AWS region'
    "AWS_S3_BUCKET" = 'S3 bucket name'
    "UPSTASH_REDIS_REST_URL" = 'Upstash Redis URL'
    "UPSTASH_REDIS_REST_TOKEN" = 'Upstash Redis token'
}

Write-Host "📋 Required Secrets:" -ForegroundColor Yellow
Write-Host ""

foreach ($key in $secrets.Keys) {
    $description = $secrets[$key]
    Write-Host "$key" -ForegroundColor Green
    Write-Host "  Description: $description" -ForegroundColor Gray
    
    if ($key -eq "NODE_ENV") {
        $value = "production"
        Write-Host "  Using default value: $value" -ForegroundColor Cyan
    } else {
        $value = Read-Host "  Enter value (or press Enter to skip)"
        if ([string]::IsNullOrWhiteSpace($value)) {
            Write-Host "  ⚠️  Skipping $key" -ForegroundColor Yellow
            continue
        }
    }
    
    Write-Host "  Setting secret..." -ForegroundColor Cyan
    flyctl secrets set "$key=$value" --app $AppName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Set successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to set secret" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "📋 Optional Secrets" -ForegroundColor Yellow
$setOptional = Read-Host "Do you want to set optional secrets? Enter y for yes, or press Enter to skip"

if ($setOptional -eq "y" -or $setOptional -eq "Y") {
    Write-Host ""
    foreach ($key in $optionalSecrets.Keys) {
        $description = $optionalSecrets[$key]
        Write-Host "$key" -ForegroundColor Green
        Write-Host "  Description: $description" -ForegroundColor Gray
        $value = Read-Host "  Enter value - or press Enter to skip"
        
        if ([string]::IsNullOrWhiteSpace($value)) {
            Write-Host "  ⏭️  Skipping $key" -ForegroundColor Yellow
            continue
        }
        
        Write-Host "  Setting secret..." -ForegroundColor Cyan
        flyctl secrets set "$key=$value" --app $AppName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Set successfully" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Failed to set secret" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host ""
Write-Host "✅ Secret setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 To view all secrets:" -ForegroundColor Cyan
Write-Host "   flyctl secrets list --app $AppName" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to deploy:" -ForegroundColor Cyan
Write-Host "   flyctl deploy" -ForegroundColor White

