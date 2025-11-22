# Fix: Prepared Statement Error with PgBouncer

## Problem

```
Error: prepared statement "s3" already exists
Code: 42P05
```

This error occurs when Prisma tries to use prepared statements with PgBouncer in transaction pooling mode. PgBouncer doesn't support prepared statements.

## Solution

### 1. Add `?pgbouncer=true` to DATABASE_URL

The DATABASE_URL in Cloud Run Secret Manager should include `?pgbouncer=true`:

```
postgresql://postgres.pffssccmdbopnlgjdhwh:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 2. Code Fix Applied

The code now automatically:

- Detects if using Supabase pooler (port 6543)
- Adds `pgbouncer=true` if missing
- Prisma automatically disables prepared statements when it sees this parameter

### 3. Verify in Cloud Run

1. Go to: https://console.cloud.google.com/run/detail/us-central1/tide-raider-backend?project=surf-445620
2. Click "EDIT & DEPLOY NEW REVISION"
3. Go to "Variables & Secrets" tab
4. Check `DATABASE_URL` secret
5. Ensure it includes `?pgbouncer=true` at the end

### 4. Update Secret if Needed

If the secret doesn't have `?pgbouncer=true`, update it:

```powershell
# Get current secret value (you'll need to decrypt it)
gcloud secrets versions access latest --secret="DATABASE_URL" --project=surf-445620

# Add new version with pgbouncer=true
# Format: postgresql://...:6543/postgres?pgbouncer=true
gcloud secrets versions add DATABASE_URL --data-file=- --project=surf-445620
```

Or update via Google Cloud Console:

1. Go to Secret Manager
2. Select DATABASE_URL secret
3. Add new version
4. Paste connection string with `?pgbouncer=true` appended

## How It Works

When Prisma sees `?pgbouncer=true` in the connection string:

- It automatically disables prepared statements
- All queries use simple text queries instead
- This is compatible with PgBouncer transaction pooling mode

## Testing

After deploying, check Cloud Run logs for:

```
[prisma] ✅ Added pgbouncer=true for Supabase pooler (disables prepared statements)
[prisma] Using Supabase pooler with pgbouncer=true (prepared statements disabled)
```

If you see these messages, the fix is working.
