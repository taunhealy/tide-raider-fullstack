# Verify DATABASE_URL Secret Format

## Current Status

The secret is named `DATABASE_URL` in Cloud Run - that's correct! ✅

## Required Format for Supabase Pooler

The DATABASE_URL secret should be in this format:

```
postgresql://postgres.pffssccmdbopnlgjdhwh:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key points:**

- ✅ Port `6543` (pooler port, not 5432)
- ✅ `pooler.supabase.com` in the hostname
- ✅ `?pgbouncer=true` at the end (CRITICAL for fixing prepared statement errors)

## How to Verify/Update the Secret

### Option 1: Check via Google Cloud Console

1. Go to: https://console.cloud.google.com/security/secret-manager?project=surf-445620
2. Find `DATABASE_URL` secret
3. Click on it
4. Click "VIEW SECRET VALUE" (you'll need permissions)
5. Verify it ends with `?pgbouncer=true`

### Option 2: Check via gcloud CLI

```powershell
# View the secret value (you'll need proper IAM permissions)
gcloud secrets versions access latest --secret="DATABASE_URL" --project=surf-445620
```

### Option 3: Check Cloud Run Configuration

1. Go to: https://console.cloud.google.com/run/detail/us-central1/tide-raider-backend?project=surf-445620
2. Click "EDIT & DEPLOY NEW REVISION"
3. Go to "Variables & Secrets" tab
4. Look for `DATABASE_URL` under "Secrets"
5. It should reference: `DATABASE_URL:latest`

## If Secret Doesn't Have `?pgbouncer=true`

The code will automatically add it, but it's better to set it in the secret itself.

### Update Secret via Google Cloud Console:

1. Go to Secret Manager
2. Select `DATABASE_URL`
3. Click "ADD NEW VERSION"
4. Paste the connection string with `?pgbouncer=true` appended
5. Save

### Update Secret via gcloud CLI:

```powershell
# First, get your Supabase connection string from Supabase dashboard
# Then update the secret:
echo "postgresql://postgres.pffssccmdbopnlgjdhwh:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true" | gcloud secrets versions add DATABASE_URL --data-file=- --project=surf-445620
```

## What the Code Does

Even if the secret doesn't have `?pgbouncer=true`, the updated code will:

1. Detect it's using the pooler (port 6543)
2. Automatically add `?pgbouncer=true`
3. Log: `[prisma] ✅ Added pgbouncer=true for Supabase pooler`

So the fix will work either way, but having it in the secret is cleaner.

## Next Steps

1. ✅ Deploy the updated code (with the prisma.ts fix)
2. ✅ Check Cloud Run logs for the `pgbouncer=true` message
3. ✅ Verify the prepared statement errors are gone
4. (Optional) Update the secret to include `?pgbouncer=true` for clarity
