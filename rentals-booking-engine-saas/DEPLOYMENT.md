# Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the booking engine to production:
- **Backend**: Google Cloud Run (always-on)
- **Frontend**: Vercel
- **Database**: Supabase Postgres

---

## 📦 Prerequisites

### Tools Required

```bash
# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
gcloud init

# Vercel CLI
npm install -g vercel

# Node.js 20+
nvm install 20
nvm use 20
```

### Accounts Required

- [ ] Google Cloud account (with billing enabled)
- [ ] Vercel account
- [ ] Supabase account
- [ ] PayPal business account
- [ ] WeatherAPI.com account
- [ ] Google OAuth app credentials

---

## 🗄️ Step 1: Setup Database (Supabase)

### 1.1 Create Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Choose region (closest to your users)
4. Set strong database password

### 1.2 Get Connection Strings

```bash
# From Supabase Settings > Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

### 1.3 Setup Prisma Accelerate (Optional but Recommended)

1. Go to [Prisma Data Platform](https://cloud.prisma.io)
2. Create project
3. Connect your Supabase database
4. Get Accelerate connection string:

```bash
PRISMA_ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
```

### 1.4 Push Schema

```bash
cd packages/booking-engine

# Set environment variables
export DATABASE_URL="..."
export DIRECT_DATABASE_URL="..."

# Push schema
npx prisma db push

# Seed database
npm run db:seed

# Verify with Prisma Studio
npx prisma studio
```

---

## ☁️ Step 2: Deploy Backend (Google Cloud Run)

### 2.1 Setup Google Cloud Project

```bash
# Login
gcloud auth login

# Create project
gcloud projects create rental-booking-engine-prod

# Set active project
gcloud config set project rental-booking-engine-prod

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com
```

### 2.2 Setup Environment Variables

Create a `.env.production` file (DO NOT commit):

```bash
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."
PRISMA_ACCELERATE_URL="prisma://..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
PAYPAL_MODE="live"
WEATHER_API_KEY="..."
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"
NODE_ENV="production"
CORS_ORIGIN="https://your-domain.com"
PORT=8080
```

### 2.3 Store Secrets in Google Secret Manager

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Store each secret
echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
echo -n "your-encryption-key" | gcloud secrets create ENCRYPTION_KEY --data-file=-
# ... repeat for all secrets
```

### 2.4 Build and Deploy

```bash
cd packages/booking-engine

# Submit build
gcloud builds submit --config cloudbuild.yaml

# Deploy to Cloud Run
gcloud run deploy booking-engine-api \
  --image gcr.io/rental-booking-engine-prod/booking-engine-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --set-secrets \
    DATABASE_URL=DATABASE_URL:latest,\
    ENCRYPTION_KEY=ENCRYPTION_KEY:latest,\
    NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest \
  --set-env-vars \
    NODE_ENV=production,\
    CORS_ORIGIN=https://your-domain.com
```

### 2.5 Get Backend URL

```bash
gcloud run services describe booking-engine-api \
  --region us-central1 \
  --format 'value(status.url)'

# Example output: https://booking-engine-api-xxx-uc.a.run.app
```

### 2.6 Setup Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service booking-engine-api \
  --domain api.your-domain.com \
  --region us-central1

# Follow DNS instructions to verify ownership
```

---

## 🌐 Step 3: Deploy Frontend (Vercel)

### 3.1 Link Project to Vercel

```bash
cd packages/client-website

# Login to Vercel
vercel login

# Link project
vercel link
```

### 3.2 Set Environment Variables

```bash
# Via Vercel Dashboard or CLI
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://booking-engine-api-xxx-uc.a.run.app

vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add AUTH_GOOGLE_ID
vercel env add AUTH_GOOGLE_SECRET
vercel env add DATABASE_URL
```

### 3.3 Deploy

```bash
# Deploy to production
vercel --prod

# Verify deployment
vercel ls
```

### 3.4 Setup Custom Domain

1. Go to Vercel Dashboard > Settings > Domains
2. Add your domain: `your-domain.com`
3. Follow DNS instructions

---

## 🔐 Step 4: Setup Google OAuth

### 4.1 Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services > OAuth consent screen
3. Fill in app information
4. Add scopes: `email`, `profile`

### 4.2 Create OAuth Credentials

1. APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
4. Save Client ID and Client Secret

---

## 💳 Step 5: Setup PayPal

### 5.1 Create PayPal Business Account

1. Sign up at [PayPal Business](https://www.paypal.com/business)
2. Verify your account

### 5.2 Create Live App

1. Go to [PayPal Developer](https://developer.paypal.com)
2. Dashboard > My Apps & Credentials
3. Switch to "Live" mode
4. Create App
5. Copy Live Client ID and Secret

### 5.3 Setup Webhooks

1. In PayPal Developer Dashboard
2. Webhooks > Add Webhook
3. Webhook URL: `https://api.your-domain.com/webhooks/paypal`
4. Event types:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
5. Save Webhook ID

---

## 🌤️ Step 6: Setup WeatherAPI

1. Sign up at [WeatherAPI.com](https://www.weatherapi.com/signup.aspx)
2. Get API key from dashboard
3. Add to environment variables

---

## ✅ Step 7: Verify Deployment

### 7.1 Test Backend

```bash
# Health check
curl https://api.your-domain.com/health

# Expected response:
# {"status":"ok","timestamp":"...","service":"booking-engine"}
```

### 7.2 Test Frontend

1. Visit `https://your-domain.com`
2. Verify homepage loads
3. Test Google OAuth login

### 7.3 Test PayPal Integration

1. Create a test booking
2. Complete PayPal checkout
3. Verify webhook received
4. Check booking status in database

---

## 📊 Step 8: Monitoring & Logging

### Backend Monitoring (Cloud Run)

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=booking-engine-api" \
  --limit 50 \
  --format json

# Setup log-based alerts
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Backend Errors" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

### Frontend Monitoring (Vercel)

- Automatic performance monitoring in Vercel Dashboard
- Setup Vercel Analytics for real user monitoring

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      - run: |
          cd packages/booking-engine
          gcloud builds submit --config cloudbuild.yaml

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🚨 Troubleshooting

### Backend won't start

```bash
# Check Cloud Run logs
gcloud run services logs read booking-engine-api --region us-central1

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Prisma client not generated
```

### Frontend can't connect to backend

```bash
# Verify NEXT_PUBLIC_API_URL
vercel env ls

# Test CORS
curl -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://api.your-domain.com/health
```

### PayPal webhooks not working

1. Verify webhook URL is publicly accessible
2. Check webhook signature verification
3. View webhook attempts in PayPal Developer Dashboard

---

## 📝 Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Google OAuth login works
- [ ] Database queries execute
- [ ] PayPal integration tested
- [ ] Weather API fetches data
- [ ] Monitoring setup complete
- [ ] Backups configured (Supabase)
- [ ] SSL certificates active
- [ ] Error tracking enabled
- [ ] Performance monitoring active

---

**Deployment complete!** 🎉

Your multi-tenant booking engine is now live and ready to serve rental companies.

