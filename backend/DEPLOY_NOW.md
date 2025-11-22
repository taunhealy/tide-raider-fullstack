# Deploy to Cloud Run - Step by Step

Your project: **surf-445620** (Project number: 82632174665)

## Step 1: Install Google Cloud SDK

### Windows Installation

1. **Download installer:**
   - Go to: https://cloud.google.com/sdk/docs/install
   - Download "Google Cloud SDK for Windows"
   - Run the installer

2. **Or use package manager:**

   ```powershell
   # Chocolatey
   choco install gcloudsdk

   # Scoop
   scoop install gcloud
   ```

3. **Restart your terminal** after installation

4. **Verify installation:**
   ```powershell
   gcloud --version
   ```

## Step 2: Authenticate and Set Project

```powershell
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project surf-445620

# Verify
gcloud config get-value project
```

## Step 3: Enable Required APIs

```powershell
# Enable all required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Verify APIs are enabled
gcloud services list --enabled
```

## Step 4: Create Artifact Registry

```powershell
# Create Docker repository for storing images
gcloud artifacts repositories create tide-raider \
  --repository-format=docker \
  --location=us-central1 \
  --description="Tide Raider Backend Docker images"
```

## Step 5: Store Secrets in Secret Manager

### 5.1 Database URL (Pooler Connection - Recommended)

```powershell
# Use the pooler connection for Cloud Run
echo -n "postgresql://postgres.pffssccmdbopnlgjdhwh:Rgbalpha123!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require" | `
  gcloud secrets create DATABASE_URL --data-file=-
```

### 5.2 Other Secrets

```powershell
# Google OAuth (from your .env)
echo -n "82632174665-tlmshrjeeahbb3giec045o009u8ag67j.apps.googleusercontent.com" | `
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

echo -n "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" | `
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# JWT Secrets (from your .env)
echo -n "gdfdsddsadsadghhhhsdsdsdansa" | `
  gcloud secrets create JWT_SECRET --data-file=-

echo -n "gdfdsddsadsadghhhhsdsdsdansa" | `
  gcloud secrets create NEXTAUTH_SECRET --data-file=-

# Frontend URL
echo -n "https://www.tideraider.com" | `
  gcloud secrets create FRONTEND_URL --data-file=-
```

### 5.3 Grant Cloud Run Access to Secrets

```powershell
# Get project number
$PROJECT_NUMBER = gcloud projects describe surf-445620 --format="value(projectNumber)"

# Grant access to all secrets
$SECRETS = @("DATABASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "JWT_SECRET", "NEXTAUTH_SECRET", "FRONTEND_URL")

foreach ($SECRET in $SECRETS) {
  gcloud secrets add-iam-policy-binding $SECRET `
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
    --role="roles/secretmanager.secretAccessor"
}
```

## Step 6: Deploy to Cloud Run

```powershell
# Navigate to backend directory
cd backend

# Deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml `
  --substitutions=_REGION=us-central1,_SERVICE_NAME=tide-raider-backend
```

## Step 7: Get Your Service URL

```powershell
# Get the deployed service URL
gcloud run services describe tide-raider-backend `
  --region us-central1 `
  --format="value(status.url)"
```

## Step 8: Test Deployment

```powershell
# Test health endpoint
$URL = gcloud run services describe tide-raider-backend --region us-central1 --format="value(status.url)"
Invoke-WebRequest "$URL/health"
```

## Step 9: Update Frontend

Update `next/.env.production`:

```env
NEXT_PUBLIC_BACKEND_URL=https://tide-raider-backend-xxxxx-uc.a.run.app
```

## Troubleshooting

### View Logs

```powershell
gcloud run services logs read tide-raider-backend --region us-central1 --limit 50
```

### Update Service

```powershell
# After code changes
gcloud builds submit --config=cloudbuild.yaml
```

### Update Secrets

```powershell
# Update a secret
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Update service to use new secret version
gcloud run services update tide-raider-backend `
  --region us-central1 `
  --update-secrets SECRET_NAME=SECRET_NAME:latest
```

## Cost

- **Free Tier**: $0/month (within limits)
- **Small Production**: ~$5-15/month
- **Supabase**: $0/month (free tier) or $25/month (Pro)

Total: **$5-40/month** (much cheaper than Fly.io!)
