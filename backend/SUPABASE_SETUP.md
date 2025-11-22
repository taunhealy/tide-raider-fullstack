# Supabase Setup Guide for Tide Raider

This guide helps you set up a Supabase PostgreSQL database for your Tide Raider backend.

## Why Supabase?

- **Free Tier**: 500 MB database storage (perfect for development/testing)
- **PostgreSQL Compatible**: Works seamlessly with Prisma
- **Connection Pooling**: Built-in connection pooling for serverless functions
- **Auto-Pause**: Automatically pauses after 1 week of inactivity (saves costs)
- **Easy Migration**: Simple connection string, works with existing Prisma schema

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"**
3. Sign up with GitHub, Google, or email
4. Verify your email if required

## Step 2: Create a New Project

1. In the Supabase dashboard, click **"New Project"**
2. Select or create an organization
3. Fill in project details:
   - **Name**: `tide-raider` (or your preferred name)
   - **Database Password**: 
     - Click **"Generate a password"** or create your own
     - **SAVE THIS PASSWORD** - you won't be able to see it again!
     - Use a password manager to store it securely
   - **Region**: Choose closest to your users
     - **US East (N. Virginia)** for US East Coast
     - **US West (Oregon)** for US West Coast
     - **EU West (Ireland)** for Europe
   - **Pricing Plan**: Select **Free** for development/testing
4. Click **"Create new project"**
5. Wait 2-3 minutes for the database to be provisioned

## Step 3: Get Your Connection String

### 3.1 Find Connection String

1. In your project dashboard, go to **Settings** (gear icon in sidebar)
2. Click **Database** in the settings menu
3. Scroll down to **Connection string** section
4. You'll see different connection string formats

### 3.2 Connection String Formats

Supabase provides several connection string formats:

**URI Format** (Recommended for Prisma):
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**Connection Pooling Format** (For serverless/Cloud Run):
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Session Mode Format** (For migrations/admin):
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 3.3 Format for Prisma

For Prisma, use the **URI format** with SSL:

1. Copy the **URI** connection string
2. Replace `[YOUR-PASSWORD]` with your actual database password
3. Add `?sslmode=require` at the end if not already present

**Final format:**
```
postgresql://postgres:your_actual_password@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
```

### 3.4 Store Connection String

Save this connection string securely - you'll need it for:
- Local development (`.env` file)
- Google Cloud Secret Manager (for Cloud Run deployment)
- Running migrations

## Step 4: Run Database Migrations

### 4.1 Local Migration

Run Prisma migrations against your Supabase database:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"

# Or add to .env file
echo 'DATABASE_URL="postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require"' >> .env

# Navigate to backend directory
cd backend

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### 4.2 Verify Connection

Test your connection:

```bash
# Open Prisma Studio
npx prisma studio

# Or test with a simple query
npx prisma db execute --stdin <<< "SELECT 1;"
```

## Step 5: Configure for Cloud Run

When deploying to Cloud Run, you'll store the connection string in Google Secret Manager:

```bash
# Store connection string as secret
echo -n "postgresql://postgres:your_password@db.xxxxx.supabase.co:5432/postgres?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-
```

See `DEPLOY_TO_CLOUD_RUN.md` for complete deployment instructions.

## Step 6: Enable Connection Pooling (Optional but Recommended)

For serverless functions (like Cloud Run), use Supabase's connection pooler:

1. Go to **Settings** → **Database**
2. Find **Connection pooling** section
3. Use the **Transaction** pooler connection string for Prisma
4. Format: `postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require`

**Benefits:**
- Better for serverless/Cloud Run
- Handles connection limits better
- More efficient for short-lived connections

## Database Management

### View Data in Supabase Dashboard

1. Go to **Table Editor** in the Supabase dashboard
2. View and edit tables directly
3. Run SQL queries in **SQL Editor**

### Run SQL Queries

1. Go to **SQL Editor** in Supabase dashboard
2. Write and execute SQL queries
3. View results, create views, etc.

### Backups

Supabase automatically backs up your database:
- **Free tier**: Point-in-time recovery (PITR) for 1 day
- **Pro tier**: PITR for 7 days

## Free Tier Limits

The Supabase free tier includes:

- **Database Storage**: 500 MB
- **File Storage**: 1 GB
- **Bandwidth**: 2 GB egress
- **API Requests**: Unlimited (reasonable use)
- **Database Size**: 500 MB max
- **Database Branches**: 1 branch (production)

**Auto-pause**: Projects pause after 1 week of inactivity (wake up takes ~2-5 seconds)

## Upgrading to Pro Plan

When you need more resources:

1. Go to **Settings** → **Billing**
2. Click **"Upgrade to Pro"**
3. **Pro Plan** ($25/month) includes:
   - 8 GB database storage (+ $0.125/GB additional)
   - 100 GB file storage (+ $0.021/GB additional)
   - 250 GB bandwidth (+ $0.09/GB additional)
   - Daily backups for 7 days
   - No auto-pause

## Troubleshooting

### Connection Timeout

If you get connection timeouts:

1. Check your connection string format
2. Ensure `?sslmode=require` is included
3. Verify your IP isn't blocked (check Supabase dashboard → Settings → Database)
4. Try connection pooler format for serverless

### Migration Errors

If migrations fail:

1. Verify connection string is correct
2. Check database password is correct
3. Ensure SSL mode is set: `?sslmode=require`
4. Check Supabase dashboard for error messages

### Database Paused

If your database is paused:

1. Go to Supabase dashboard
2. Click **"Restore"** or **"Resume"** button
3. Wait 2-5 seconds for it to wake up
4. Retry your connection

### Connection Limits

Free tier has connection limits:
- Direct connections: Limited
- Use connection pooler for better performance
- Consider upgrading if you hit limits frequently

## Security Best Practices

1. **Never commit connection strings** to git
2. **Use environment variables** or secret managers
3. **Rotate passwords** regularly
4. **Use connection pooling** for production
5. **Enable IP restrictions** if needed (Pro plan)

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Get connection string
3. ✅ Run migrations
4. ➡️ Deploy to Cloud Run (see `DEPLOY_TO_CLOUD_RUN.md`)
5. ➡️ Update frontend to use new backend URL

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase PostgreSQL Guide](https://supabase.com/docs/guides/database)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)


