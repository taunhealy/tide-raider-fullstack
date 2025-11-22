# Deploy to Google Cloud Run + Supabase

This guide walks you through deploying the Tide Raider backend to Google Cloud Run with a Supabase PostgreSQL database.

## Prerequisites

1. **Google Cloud Account**: Sign up at [cloud.google.com](https://cloud.google.com) (get $300 free credits)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com) (free tier available)
3. **Google Cloud SDK (gcloud CLI)**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Choose an organization (or create one)
4. Fill in project details:
   - **Name**: `tide-raider` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `US East` or `US West`)
   - **Pricing Plan**: Select **Free** (500 MB storage, great for development)
5. Click **"Create new project"**
6. Wait 2-3 minutes for the database to be provisioned

### 1.2 Get Connection String

1. In your Supabase project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the **Connection string** (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
5. **Replace `[YOUR-PASSWORD]`** with your actual database password
6. Add `?sslmode=require` at the end (if not already present)
7. Save this connection string - you'll need it in Step 3

Example connection string:

```
postgresql://postgres:your_password@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
```

### 1.3 Run Database Migrations

Once you have the connection string, run your Prisma migrations:

```bash
# Set your Supabase connection string
export DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"

# Run migrations
cd backend
npx prisma migrate deploy

# Generate Prisma Client (if needed)
npx prisma generate
```

**Note**: Make sure your `.env` file has the correct `DATABASE_URL` if running migrations locally.

## Step 2: Set Up Google Cloud Project

### 2.1 Install Google Cloud SDK

If you haven't already:

```bash
# Windows (PowerShell - run as Administrator)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe

# Or use package manager
# Using Chocolatey: choco install gcloudsdk
# Using Scoop: scoop install gcloud
```

After installation, restart your terminal.

### 2.2 Authenticate and Initialize

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (or use existing)
gcloud projects create tide-raider-backend --name="Tide Raider Backend"

# Set the project as active
gcloud config set project tide-raider-backend

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 2.3 Create Artifact Registry Repository

```bash
# Create repository for Docker images
gcloud artifacts repositories create tide-raider \
  --repository-format=docker \
  --location=us-central1 \
  --description="Tide Raider Backend Docker images"
```

## Step 3: Configure Secrets

### 3.1 Store Secrets in Google Secret Manager

```bash
# Replace values with your actual secrets

# Database connection string (from Supabase)
echo -n "postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Google OAuth credentials
echo -n "your-google-client-id" | \
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

echo -n "your-google-client-secret" | \
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# JWT secrets (generate strong random strings)
echo -n "your-jwt-secret-key-here" | \
  gcloud secrets create JWT_SECRET --data-file=-

echo -n "your-nextauth-secret-key-here" | \
  gcloud secrets create NEXTAUTH_SECRET --data-file=-

# Frontend URL
echo -n "https://www.tideraider.com" | \
  gcloud secrets create FRONTEND_URL --data-file=-
```

**Windows PowerShell** (if `echo -n` doesn't work):

```powershell
# Database URL
"postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Google OAuth
"your-google-client-id" | \
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

"your-google-client-secret" | \
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# JWT Secrets (generate new random strings)
"your-jwt-secret-key-here" | \
  gcloud secrets create JWT_SECRET --data-file=-

"your-nextauth-secret-key-here" | \
  gcloud secrets create NEXTAUTH_SECRET --data-file=-

# Frontend URL
"https://www.tideraider.com" | \
  gcloud secrets create FRONTEND_URL --data-file=-
```

### 3.2 Grant Cloud Run Access to Secrets

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant Cloud Run service account access to secrets
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GOOGLE_CLIENT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding GOOGLE_CLIENT_SECRET \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding NEXTAUTH_SECRET \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding FRONTEND_URL \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 4: Deploy to Cloud Run

### 4.1 Deploy Using Cloud Build (Recommended)

```bash
# Navigate to backend directory
cd backend

# Submit build to Cloud Build
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_SERVICE_NAME=tide-raider-backend
```

### 4.2 Deploy Manually (Alternative)

If you prefer manual deployment:

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/$(gcloud config get-value project)/tide-raider-backend

# Deploy to Cloud Run
gcloud run deploy tide-raider-backend \
  --image gcr.io/$(gcloud config get-value project)/tide-raider-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --update-secrets DATABASE_URL=DATABASE_URL:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest,JWT_SECRET=JWT_SECRET:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,FRONTEND_URL=FRONTEND_URL:latest
```

### 4.3 Get Your Service URL

After deployment, get your service URL:

```bash
gcloud run services describe tide-raider-backend \
  --region us-central1 \
  --format="value(status.url)"
```

The output will be something like:

```
https://tide-raider-backend-xxxxx-uc.a.run.app
```

## Step 5: Update Frontend Configuration

Update your Next.js frontend to use the new Cloud Run backend URL:

1. Update `.env` or `.env.production`:

   ```env
   NEXT_PUBLIC_BACKEND_URL=https://tide-raider-backend-xxxxx-uc.a.run.app
   ```

2. Or update your frontend code to use the new backend URL.

## Step 6: Verify Deployment

Test your deployment:

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe tide-raider-backend \
  --region us-central1 \
  --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/health

# Should return: {"status":"ok","timestamp":"..."}
```

## Step 7: Set Up CI/CD (Optional)

To automatically deploy on git push, set up Cloud Build triggers:

```bash
# Connect your GitHub repository
gcloud builds triggers create github \
  --name="deploy-tide-raider-backend" \
  --repo-name="tide-raider-fullstack" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^main$" \
  --build-config="backend/cloudbuild.yaml"
```

## Troubleshooting

### Check Logs

```bash
# View Cloud Run logs
gcloud run services logs read tide-raider-backend \
  --region us-central1 \
  --limit 50
```

### Update Secrets

```bash
# Update a secret
echo -n "new-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Then redeploy to pick up new secret versions
gcloud run services update tide-raider-backend \
  --region us-central1 \
  --update-secrets SECRET_NAME=SECRET_NAME:latest
```

### Common Issues

1. **Port 4001 vs 8080**: Cloud Run uses PORT env var (defaults to 8080). The Dockerfile and server code already handle this.

2. **Database Connection**: Make sure your Supabase connection string includes `?sslmode=require` for SSL.

3. **Cold Starts**: Cloud Run may have 1-3 second cold starts. Set `--min-instances=1` to keep one instance warm (costs more).

4. **Memory/CPU**: Adjust `--memory` and `--cpu` flags if you see out-of-memory errors.

## Cost Estimation

**Free Tier (Development/Testing)**:

- Cloud Run: **$0/month** (within free tier: 180k vCPU-seconds, 2M requests)
- Supabase: **$0/month** (free tier: 500 MB storage)

**Small Production App**:

- Cloud Run: **~$5-15/month** (depending on traffic)
- Supabase: **$0/month** (free tier) or **$25/month** (Pro plan if you need more storage)

**Total**: **$5-40/month** (much cheaper than Fly.io MPG Clusters at ~$14/month just for database)

## Next Steps

1. Set up monitoring and alerts in Google Cloud Console
2. Configure custom domain (optional)
3. Set up automated backups for Supabase database
4. Configure Cloud Run minimum instances if you need to eliminate cold starts
