# Setup Supabase for Local Development

This guide shows you how to use Supabase instead of Docker Postgres for local development.

## Benefits

- ✅ Same database as production
- ✅ No need to run Docker
- ✅ Test with real data
- ✅ Easier to sync between dev and prod

## Step 1: Get Supabase Connection String

1. Go to your Supabase project: https://supabase.com/dashboard/project/pffssccmdbopnlgjdhwh
2. Navigate to **Settings** → **Database**
3. Copy the **Connection string** → **URI** (Direct connection)

**Format:**

```
postgresql://postgres:[YOUR-PASSWORD]@db.pffssccmdbopnlgjdhwh.supabase.co:5432/postgres
```

## Step 2: Update Backend .env

Create or update `backend/.env`:

```env
# Supabase Database (for local development)
# Use DIRECT connection (port 5432) for local dev - better for migrations
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.pffssccmdbopnlgjdhwh.supabase.co:5432/postgres

# Server Configuration
NODE_ENV=development
PORT=4001

# Frontend URL
FRONTEND_URL=http://localhost:3000

# OAuth (for localhost:3000)
GOOGLE_CLIENT_ID=82632174665-tlmshrjeeahbb3giec045o009u8ag67j.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[YOUR-GOOGLE-CLIENT-SECRET]

# JWT Secrets (generate secure random strings)
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this
AUTH_SECRET=your-auth-secret-key-change-this
JWT_SECRET=your-jwt-secret-key-change-this

# Optional: Cron Security
CRON_SECRET=your-cron-secret-key
```

**Important:**

- Replace `[YOUR-PASSWORD]` with your actual Supabase database password
- Replace `[YOUR-GOOGLE-CLIENT-SECRET]` with your actual Google OAuth client secret
- Use **direct connection** (port 5432) for local development - better for migrations and Prisma

## Step 3: Stop Docker Postgres (if running)

If you have Docker Postgres running, stop it:

```bash
cd backend
npm run db:stop
# Or: docker-compose down
```

## Step 4: Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

## Step 5: Run Migrations (if needed)

If you haven't run migrations on Supabase yet:

```bash
cd backend
npx prisma migrate deploy
```

**Note:** Migrations should already be applied if you followed the Supabase setup guide.

## Step 6: Start Backend

```bash
cd backend
npm run dev
```

The backend will now connect to Supabase instead of Docker Postgres!

## Step 7: Start Frontend

In a separate terminal:

```bash
cd next
npm run dev
```

## Verify Connection

1. Backend should start without errors
2. Check backend logs - should show Prisma connection successful
3. Try accessing an API endpoint that uses the database
4. Check Supabase dashboard → **Database** → **Table Editor** to see your data

## Troubleshooting

### Error: "Can't reach database server"

- Check your Supabase database password is correct
- Verify the connection string format
- Check if your IP needs to be allowlisted in Supabase (Settings → Database → Connection Pooling)

### Error: "Connection timeout"

- Supabase free tier may pause after inactivity
- Go to Supabase dashboard to wake it up
- Or use the connection pooler: `postgresql://postgres.pffssccmdbopnlgjdhwh:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

### Want to switch back to Docker Postgres?

Just change `DATABASE_URL` in `backend/.env` back to:

```
DATABASE_URL=postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev
```

## Connection String Options

### Direct Connection (Recommended for Local Dev)

```
postgresql://postgres:[PASSWORD]@db.pffssccmdbopnlgjdhwh.supabase.co:5432/postgres
```

- ✅ Better for migrations
- ✅ Better for Prisma Studio
- ✅ Full PostgreSQL features

### Connection Pooler (For Serverless/Cloud Run)

```
postgresql://postgres.pffssccmdbopnlgjdhwh:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

- ✅ Better for serverless environments
- ✅ Handles many concurrent connections
- ⚠️ Some limitations (no prepared statements, etc.)

For local development, use the **direct connection** (port 5432).
