# 🚀 Deploy to Fly.io - Step by Step Guide

## Prerequisites

1. ✅ **Fly CLI installed** (already done)
2. ✅ **Backend code ready** (already done)
3. ⚠️ **Database** - You'll need a PostgreSQL database
4. ⚠️ **Secrets** - Environment variables to set

## Step-by-Step Deployment

### Step 1: Login to Fly.io

```powershell
# Make sure flyctl is in PATH
$env:PATH += ";C:\Users\taunh\.fly\bin"

# Login to Fly.io
flyctl auth login
```

This will open a browser for authentication.

### Step 2: Create the App (First Time Only)

```powershell
cd backend
flyctl apps create tide-raider-backend
```

If the app already exists, skip this step.

### Step 3: Set Up Database

**Option A: Use Fly Postgres (Recommended)**

```powershell
# Create a Postgres database
flyctl postgres create --name tide-raider-db --region iad

# Attach it to your app
flyctl postgres attach tide-raider-db --app tide-raider-backend
```

This automatically sets `DATABASE_URL` as a secret.

**Option B: Use External Database**

If you have an existing PostgreSQL database, just set the connection string in Step 4.

### Step 4: Set Required Secrets

Run these commands, replacing the placeholder values:

```powershell
# 1. DATABASE_URL (if not set by Fly Postgres)
flyctl secrets set DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require" --app tide-raider-backend

# 2. NEXTAUTH_SECRET (must match your frontend)
flyctl secrets set NEXTAUTH_SECRET="your-nextauth-secret-key" --app tide-raider-backend

# 3. FRONTEND_URL (your Vercel deployment URL)
flyctl secrets set FRONTEND_URL="https://your-app.vercel.app" --app tide-raider-backend

# 4. CRON_SECRET (generate a random string)
flyctl secrets set CRON_SECRET="your-random-secret-key" --app tide-raider-backend

# 5. NODE_ENV
flyctl secrets set NODE_ENV="production" --app tide-raider-backend
```

**Quick Secret Generator:**

```powershell
# Generate random secrets
node -e "console.log('NEXTAUTH_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('CRON_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Verify Secrets

```powershell
flyctl secrets list --app tide-raider-backend
```

You should see all 5 required secrets listed.

### Step 6: Deploy!

```powershell
cd backend
flyctl deploy
```

This will:

- Build the Docker image
- Push it to Fly.io
- Deploy your app
- Show you the deployment URL

### Step 7: Run Database Migrations

After first deployment, run migrations:

```powershell
# Option 1: SSH into the machine
flyctl ssh console --app tide-raider-backend
# Then inside:
cd /app
npx prisma migrate deploy

# Option 2: Run from local machine (pointing to production DB)
# Get DATABASE_URL first:
flyctl secrets list --app tide-raider-backend
# Then:
$env:DATABASE_URL="your-production-db-url"
npx prisma migrate deploy
```

### Step 8: Verify Deployment

```powershell
# Check health endpoint
curl https://tide-raider-backend.fly.dev/health

# Check logs
flyctl logs --app tide-raider-backend

# Check status
flyctl status --app tide-raider-backend
```

### Step 9: Update Frontend

Update your frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev
```

## 🎯 Quick Reference

### Essential Commands

```powershell
# View logs
flyctl logs --app tide-raider-backend

# SSH into machine
flyctl ssh console --app tide-raider-backend

# View secrets
flyctl secrets list --app tide-raider-backend

# Update a secret
flyctl secrets set KEY="value" --app tide-raider-backend

# Remove a secret
flyctl secrets unset KEY --app tide-raider-backend

# Scale the app
flyctl scale count 2 --app tide-raider-backend

# View app status
flyctl status --app tide-raider-backend
```

## 🔧 Troubleshooting

### Build Fails

- Check logs: `flyctl logs --app tide-raider-backend`
- Verify Dockerfile is correct
- Check TypeScript compilation locally: `npm run build`

### Database Connection Fails

- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Fly.io IPs
- Ensure SSL mode is set: `?sslmode=require`

### App Crashes on Start

- Check logs: `flyctl logs --app tide-raider-backend`
- Verify all required secrets are set
- Check Prisma client is generated

### CORS Errors

- Verify `FRONTEND_URL` matches your frontend URL exactly
- Check frontend is using correct backend URL

## 📝 Post-Deployment Checklist

- [ ] Health endpoint works: `https://tide-raider-backend.fly.dev/health`
- [ ] Database migrations ran successfully
- [ ] Frontend can connect to backend
- [ ] Secrets are all set correctly
- [ ] Logs show no errors
- [ ] Cron endpoint is accessible (with secret)

## 🚀 Next Steps After Deployment

1. **Set up GitHub Actions** for cron jobs (see `.github/workflows/cron-jobs.yml`)
   - Add `CRON_SECRET` and `BACKEND_URL` to GitHub Secrets

2. **Monitor your app:**

   ```powershell
   flyctl logs --app tide-raider-backend --follow
   ```

3. **Set up custom domain** (optional):
   ```powershell
   flyctl certs add yourdomain.com --app tide-raider-backend
   ```

## 💰 Cost Considerations

Fly.io free tier includes:

- 3 shared-cpu-1x VMs
- 3GB persistent volume storage
- 160GB outbound data transfer

Your app should fit comfortably in the free tier for development/testing.

## ✅ You're Ready!

Once you complete these steps, your backend will be live at:
`https://tide-raider-backend.fly.dev`

Good luck with your deployment! 🎉
