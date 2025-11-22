# Quick Setup Guide

**Start here!** This is the fastest way to get your backend deployed to Cloud Run with Supabase.

## What You're Setting Up

```
Frontend (Vercel) → Cloud Run (Express.js) → Supabase (PostgreSQL)
```

**Everything runs on Cloud Run:**

- All APIs
- Auth (Passport)
- Scrapers
- Cron Jobs

**Supabase is used ONLY for:**

- PostgreSQL database (nothing else)

## 30-Minute Setup

### 1. Supabase Database (10 min)

1. Go to [supabase.com](https://supabase.com) → Sign up
2. Create project → Name: `tide-raider`
3. **Save the database password!**
4. Get connection string from Settings → Database
5. Run migrations locally:
   ```bash
   export DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require"
   cd backend
   npx prisma migrate deploy
   ```

**✅ Done?** Check Supabase dashboard → Table Editor to see your tables

---

### 2. Google Cloud Setup (10 min)

1. Install `gcloud` CLI
2. Login: `gcloud auth login`
3. Create project: `gcloud projects create tide-raider-backend`
4. Set project: `gcloud config set project tide-raider-backend`
5. Enable APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```
6. Create registry:
   ```bash
   gcloud artifacts repositories create tide-raider \
     --repository-format=docker \
     --location=us-central1
   ```

**✅ Done?** Run `gcloud config get-value project` - should show your project

---

### 3. Store Secrets (5 min)

```bash
# Database URL (from Supabase)
echo -n "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Google OAuth
echo -n "your-google-client-id" | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-

# JWT Secrets
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "your-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-

# Frontend URL
echo -n "https://www.tideraider.com" | gcloud secrets create FRONTEND_URL --data-file=-

# Grant access
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
for SECRET in DATABASE_URL GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET JWT_SECRET NEXTAUTH_SECRET FRONTEND_URL; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

**✅ Done?** Run `gcloud secrets list` - should show all secrets

---

### 4. Deploy (5 min)

```bash
cd backend

# Deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_SERVICE_NAME=tide-raider-backend

# Get your URL
gcloud run services describe tide-raider-backend \
  --region us-central1 \
  --format="value(status.url)"
```

**✅ Done?** Visit `https://your-url.run.app/health` - should return `{"status":"ok"}`

---

## Verify Everything Works

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe tide-raider-backend \
  --region us-central1 \
  --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## Next Steps

1. ✅ Update frontend `.env.production`:

   ```env
   NEXT_PUBLIC_BACKEND_URL=https://your-url.run.app
   ```

2. ✅ Test your app end-to-end

3. ✅ Set up CI/CD (optional) - see `GITHUB_LINKING_GUIDE.md`

---

## Troubleshooting

### Can't Connect to Database?

```bash
# Check secret
gcloud secrets versions access latest --secret=DATABASE_URL

# Test connection
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require"
```

### Service Won't Start?

```bash
# Check logs
gcloud run services logs read tide-raider-backend \
  --region us-central1 \
  --limit 50
```

### Build Fails?

```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log <BUILD_ID>
```

---

## Full Documentation

- **Complete Setup**: `SETUP_SUPABASE_CLOUDRUN.md` (detailed step-by-step)
- **Architecture**: `ARCHITECTURE.md` (how everything works)
- **Supabase Setup**: `SUPABASE_SETUP.md` (database setup details)
- **Cloud Run Deployment**: `DEPLOY_TO_CLOUD_RUN.md` (deployment details)
- **CI/CD**: `GITHUB_LINKING_GUIDE.md` (GitHub integration)

---

## Need Help?

1. Check Cloud Run logs: `gcloud run services logs read`
2. Check Supabase dashboard for database issues
3. Verify all secrets are set correctly
4. Test health endpoint first: `/health`

---

## Cost Estimate

**Development (0-1k users):** $0/month (free tiers)  
**Small (1k-10k users):** $0-25/month  
**Medium (10k-50k users):** $35-50/month  
**Large (50k+ users):** $75-250/month

All costs scale with usage - start free and pay as you grow!
