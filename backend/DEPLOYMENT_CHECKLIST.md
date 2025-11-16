# Fly.io Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

Set these in Fly.io secrets (or `fly.toml`):

**Required:**

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-key

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# Cron Security
CRON_SECRET=your-cron-secret-key

# Server
NODE_ENV=production
PORT=3001
```

**Optional (for notifications):**

```bash
# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# WhatsApp (MessageBird)
MESSAGEBIRD_API_KEY=your-messagebird-key

# WhatsApp (Unipile/WaSenderAPI)
UNIPILE_API_KEY=your-unipile-key
WASENDER_API_KEY=your-wasender-key
WASENDER_API_URL=https://api.wasender.com

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=your-region
AWS_S3_BUCKET=your-bucket

# Redis (if using)
REDIS_URL=your-redis-url
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

### 2. Database Setup

- [ ] Database is accessible from Fly.io
- [ ] Run migrations: `fly ssh console -C "cd /app && npm run prisma:migrate deploy"`
- [ ] Or migrations run automatically on deploy (if configured)

### 3. Build Verification

Test build locally:

```bash
cd backend
npm run build
npm start
```

### 4. Files to Verify

- [x] `Dockerfile` exists and is correct
- [x] `fly.toml` is configured
- [x] `.dockerignore` is set up
- [x] `package.json` has correct scripts
- [x] `tsconfig.json` is configured
- [x] Prisma schema is in `prisma/schema.prisma`

## 🚀 Deployment Steps

### Step 1: Install Fly CLI

```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Or download from: https://fly.io/docs/hands-on/install-flyctl/
```

### Step 2: Login to Fly.io

```bash
fly auth login
```

### Step 3: Create App (if not exists)

```bash
cd backend
fly apps create tide-raider-backend
```

### Step 4: Set Environment Variables

```bash
# Set secrets
fly secrets set DATABASE_URL="postgresql://..." --app tide-raider-backend
fly secrets set NEXTAUTH_SECRET="your-secret" --app tide-raider-backend
fly secrets set FRONTEND_URL="https://your-frontend.vercel.app" --app tide-raider-backend
fly secrets set CRON_SECRET="your-cron-secret" --app tide-raider-backend
fly secrets set NODE_ENV="production" --app tide-raider-backend

# Optional: Set notification service keys
fly secrets set RESEND_API_KEY="your-key" --app tide-raider-backend
# ... etc
```

### Step 5: Attach Database (if using Fly Postgres)

```bash
fly postgres attach --app tide-raider-backend <postgres-app-name>
```

Or set `DATABASE_URL` manually if using external database.

### Step 6: Run Database Migrations

```bash
# Option 1: SSH into machine and run migrations
fly ssh console -C "cd /app && npx prisma migrate deploy"

# Option 2: Run locally pointing to production DB
DATABASE_URL="your-prod-db-url" npx prisma migrate deploy
```

### Step 7: Deploy

```bash
fly deploy
```

### Step 8: Verify Deployment

```bash
# Check health endpoint
curl https://tide-raider-backend.fly.dev/health

# Check logs
fly logs --app tide-raider-backend
```

## 🔍 Post-Deployment Verification

1. **Health Check:**

   ```bash
   curl https://tide-raider-backend.fly.dev/health
   ```

   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test API Endpoint:**

   ```bash
   curl https://tide-raider-backend.fly.dev/api/beaches
   ```

3. **Check Logs:**

   ```bash
   fly logs --app tide-raider-backend
   ```

4. **Test Cron Endpoint (with secret):**
   ```bash
   curl -X POST https://tide-raider-backend.fly.dev/api/cron/fetch-and-alert \
     -H "X-Cron-Secret: your-secret" \
     -H "Content-Type: application/json" \
     -d '{"timezone": "UTC"}'
   ```

## 🐛 Common Issues

### Issue: Build fails

- Check Dockerfile syntax
- Verify all dependencies in package.json
- Check TypeScript compilation errors

### Issue: Database connection fails

- Verify DATABASE_URL is set correctly
- Check database allows connections from Fly.io IPs
- Verify SSL mode if required

### Issue: CORS errors

- Check FRONTEND_URL is set correctly
- Verify frontend is using correct backend URL

### Issue: Prisma client not found

- Ensure `prisma generate` runs in Dockerfile
- Check Prisma schema path is correct

## 📝 Notes

- Fly.io automatically handles HTTPS
- The app will be accessible at: `https://tide-raider-backend.fly.dev`
- Update frontend `NEXT_PUBLIC_API_URL` to point to this URL
- Monitor logs regularly: `fly logs --app tide-raider-backend`
