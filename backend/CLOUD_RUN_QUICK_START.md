# Cloud Run + Supabase Quick Start

Quick reference for deploying Tide Raider backend to Google Cloud Run with Supabase.

## Prerequisites

- [x] Google Cloud account ($300 free credits)
- [ ] Supabase account (free tier available)
- [ ] Google Cloud SDK installed (`gcloud` CLI)

## Quick Setup (5 Steps)

### 1. Create Supabase Database (5 minutes)

```bash
# 1. Go to https://supabase.com and create a project
# 2. Get connection string from Settings → Database
# 3. Format: postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

See `SUPABASE_SETUP.md` for detailed instructions.

### 2. Run Migrations (2 minutes)

```bash
# Set connection string
export DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"

# Run migrations
cd backend
npx prisma migrate deploy
```

### 3. Set Up Google Cloud (5 minutes)

```bash
# Login to Google Cloud
gcloud auth login

# Create project
gcloud projects create tide-raider-backend --name="Tide Raider Backend"
gcloud config set project tide-raider-backend

# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

# Create Artifact Registry
gcloud artifacts repositories create tide-raider \
  --repository-format=docker \
  --location=us-central1
```

### 4. Store Secrets (5 minutes)

```bash
# Database URL (from Supabase)
echo -n "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Other secrets (replace with your values)
echo -n "your-google-client-id" | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "your-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
echo -n "https://www.tideraider.com" | gcloud secrets create FRONTEND_URL --data-file=-

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
# Repeat for other secrets...
```

See `DEPLOY_TO_CLOUD_RUN.md` Step 3 for complete secret setup.

### 5. Deploy (5 minutes)

```bash
# Deploy using Cloud Build
cd backend
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_SERVICE_NAME=tide-raider-backend

# Get your service URL
gcloud run services describe tide-raider-backend \
  --region us-central1 \
  --format="value(status.url)"
```

## Verify Deployment

```bash
# Test health endpoint
curl https://tide-raider-backend-xxxxx-uc.a.run.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Update Frontend

Update your Next.js frontend `.env`:

```env
NEXT_PUBLIC_BACKEND_URL=https://tide-raider-backend-xxxxx-uc.a.run.app
```

## Cost Estimate

**Free Tier (Development)**:
- Cloud Run: $0/month (within free limits)
- Supabase: $0/month (free tier: 500 MB)

**Small Production**:
- Cloud Run: ~$5-15/month
- Supabase: $0/month (free) or $25/month (Pro)

**Total: $5-40/month** (vs $14-21/month on Fly.io)

## Common Commands

```bash
# View logs
gcloud run services logs read tide-raider-backend --region us-central1 --limit 50

# Update service (after code changes)
gcloud builds submit --config=cloudbuild.yaml

# Update secrets
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-
gcloud run services update tide-raider-backend --region us-central1 --update-secrets SECRET_NAME=SECRET_NAME:latest

# Get service URL
gcloud run services describe tide-raider-backend --region us-central1 --format="value(status.url)"
```

## Need Help?

- **Detailed Setup**: See `DEPLOY_TO_CLOUD_RUN.md`
- **Supabase Setup**: See `SUPABASE_SETUP.md`
- **Troubleshooting**: Check logs with `gcloud run services logs read`

## Next Steps

1. ✅ Deploy backend to Cloud Run
2. ✅ Set up Supabase database
3. ➡️ Update frontend API URL
4. ➡️ Test full stack
5. ➡️ Set up CI/CD (optional)


