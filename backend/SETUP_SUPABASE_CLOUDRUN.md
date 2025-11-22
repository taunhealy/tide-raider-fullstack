# Complete Setup: Supabase Database + Cloud Run Backend

This is the **simplest and most scalable** setup for Tide Raider. Everything runs on Cloud Run (APIs, auth, scrapers, cron), and Supabase is used **only** as the database.

## Architecture

```
┌──────────────────┐
│   Frontend       │  → Vercel (Next.js)
│   (Next.js)      │
└──────────────────┘
         │
         │ API Calls
         ▼
┌──────────────────┐
│   Cloud Run      │  ← Everything runs here
│   (Express.js)   │     • All APIs
│                  │     • Auth (Passport)
│                  │     • Scrapers
│                  │     • Cron Jobs
└──────────────────┘
         │
         │ PostgreSQL (Prisma)
         ▼
┌──────────────────┐
│   Supabase       │  ← Database only
│   PostgreSQL     │     • No Edge Functions
│                  │     • No Supabase Auth
│                  │     • Just PostgreSQL
└──────────────────┘
```

## Why This Architecture?

✅ **Simplest** - One backend, one database  
✅ **No Migration Needed** - Your Express.js backend already works  
✅ **Scalable** - Handles 100k+ users  
✅ **Cost-Effective** - Free tier for development, $35-75/month at scale  
✅ **Easy to Debug** - All logs in one place

---

## Quick Start (30 minutes)

### Step 1: Set Up Supabase Database (10 min)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up with GitHub/Google/Email

2. **Create New Project**
   - Click **"New Project"**
   - Name: `tide-raider`
   - **Generate and save password** (you'll need it!)
   - Region: Choose closest to users (e.g., `US East`)
   - Plan: **Free** (500 MB, perfect for development)
   - Click **"Create new project"**
   - Wait 2-3 minutes for provisioning

3. **Get Connection String**
   - Go to **Settings** → **Database**
   - Scroll to **Connection string** section
   - Select **URI** tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual password
   - Add `?sslmode=require` at the end

   **Example:**

   ```
   postgresql://postgres:your_password@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
   ```

4. **Run Migrations Locally**

   ```bash
   # Set connection string
   export DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"

   # Or add to backend/.env file
   cd backend
   echo 'DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"' >> .env

   # Run migrations
   npx prisma migrate deploy

   # Generate Prisma Client
   npx prisma generate
   ```

✅ **Verify**: Check Supabase dashboard → Table Editor to see your tables

---

### Step 2: Set Up Google Cloud (10 min)

1. **Install Google Cloud SDK**

   ```bash
   # Windows PowerShell (as Administrator)
   (New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
   & $env:Temp\GoogleCloudSDKInstaller.exe

   # Or using Chocolatey
   choco install gcloudsdk

   # Or using Scoop
   scoop install gcloud
   ```

   Restart terminal after installation.

2. **Login and Create Project**

   ```bash
   # Login to Google Cloud
   gcloud auth login

   # Create new project
   gcloud projects create tide-raider-backend --name="Tide Raider Backend"

   # Set as active project
   gcloud config set project tide-raider-backend

   # Enable required APIs
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

3. **Create Artifact Registry**
   ```bash
   # Create repository for Docker images
   gcloud artifacts repositories create tide-raider \
     --repository-format=docker \
     --location=us-central1 \
     --description="Tide Raider Backend Docker images"
   ```

---

### Step 3: Store Secrets in Google Secret Manager (5 min)

Store all your secrets securely:

```bash
# Database URL (from Supabase Step 1)
echo -n "postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Google OAuth (get from Google Cloud Console)
echo -n "your-google-client-id" | \
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

echo -n "your-google-client-secret" | \
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# JWT Secrets (generate new random strings)
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
"postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

"your-google-client-id" | \
  gcloud secrets create GOOGLE_CLIENT_ID --data-file=-

"your-google-client-secret" | \
  gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

"your-jwt-secret-key-here" | \
  gcloud secrets create JWT_SECRET --data-file=-

"your-nextauth-secret-key-here" | \
  gcloud secrets create NEXTAUTH_SECRET --data-file=-

"https://www.tideraider.com" | \
  gcloud secrets create FRONTEND_URL --data-file=-
```

**Grant Cloud Run Access to Secrets:**

```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant access to all secrets
for SECRET in DATABASE_URL GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET JWT_SECRET NEXTAUTH_SECRET FRONTEND_URL; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

### Step 4: Deploy to Cloud Run (5 min)

**Option A: Deploy Using Cloud Build (Recommended - Automated)**

```bash
cd backend

# Deploy using cloudbuild.yaml
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_SERVICE_NAME=tide-raider-backend
```

**Option B: Deploy Manually**

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

**Get Your Service URL:**

```bash
# Get service URL
gcloud run services describe tide-raider-backend \
  --region us-central1 \
  --format="value(status.url)"
```

Example output: `https://tide-raider-backend-xxxxx-uc.a.run.app`

---

### Step 5: Verify Deployment

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

✅ **Verify**: Go to `https://your-service-url.run.app/health` in your browser

---

### Step 6: Update Frontend

Update your Next.js frontend to use the new Cloud Run backend:

**Update `next/.env.production`:**

```env
NEXT_PUBLIC_BACKEND_URL=https://tide-raider-backend-xxxxx-uc.a.run.app
```

Or update your frontend configuration to point to the Cloud Run URL.

---

## Architecture Summary

### What Runs Where

| Component          | Location  | Purpose                             |
| ------------------ | --------- | ----------------------------------- |
| **Frontend**       | Vercel    | Next.js UI                          |
| **Backend APIs**   | Cloud Run | Express.js server                   |
| **Authentication** | Cloud Run | Passport OAuth (not Supabase Auth)  |
| **Scrapers**       | Cloud Run | Web scraping (Playwright/Puppeteer) |
| **Cron Jobs**      | Cloud Run | Scheduled tasks                     |
| **Database**       | Supabase  | PostgreSQL only                     |

### What We're NOT Using from Supabase

❌ **Supabase Edge Functions** - All APIs on Cloud Run  
❌ **Supabase Auth** - Using Passport OAuth on Cloud Run  
❌ **Supabase Storage** - Not needed (unless you want it)  
❌ **Supabase Realtime** - Not needed (unless you want it)

✅ **Supabase PostgreSQL** - Just the database

---

## Cost at Scale

| Stage           | Users   | Cost                                 |
| --------------- | ------- | ------------------------------------ |
| **Development** | 0-1k    | $0/month (both free tiers)           |
| **Small**       | 1k-10k  | $0-25/month (Supabase Pro if >500MB) |
| **Medium**      | 10k-50k | $35-50/month                         |
| **Large**       | 50k+    | $75-250/month (with optimizations)   |

---

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

# Redeploy to pick up new secret
gcloud run services update tide-raider-backend \
  --region us-central1 \
  --update-secrets SECRET_NAME=SECRET_NAME:latest
```

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` secret is correct
   - Ensure connection string includes `?sslmode=require`
   - Verify Supabase project is active (not paused)

2. **Cold Starts**
   - Set `--min-instances=1` to eliminate cold starts ($7/month)
   - Or accept 1-3 second cold start delay

3. **Build Fails**
   - Check Dockerfile is correct
   - Verify `PORT` environment variable is set to 8080
   - Check Cloud Build logs

---

## Next Steps

1. ✅ Deploy backend to Cloud Run
2. ✅ Set up Supabase database
3. ➡️ Update frontend API URL
4. ➡️ Test full stack
5. ➡️ Set up CI/CD (optional) - see `GITHUB_LINKING_GUIDE.md`

---

## Resources

- **Supabase Setup**: See `SUPABASE_SETUP.md` for detailed database setup
- **Cloud Run Deployment**: See `DEPLOY_TO_CLOUD_RUN.md` for detailed deployment
- **GitHub Linking**: See `GITHUB_LINKING_GUIDE.md` for CI/CD setup
- **Quick Start**: See `CLOUD_RUN_QUICK_START.md` for quick reference

---

## Support

If you run into issues:

1. Check Cloud Run logs: `gcloud run services logs read`
2. Check Supabase dashboard for database issues
3. Verify all secrets are set correctly
4. Test health endpoint: `curl https://your-url.run.app/health`
