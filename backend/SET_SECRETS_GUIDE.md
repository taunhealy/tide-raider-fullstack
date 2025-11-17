# Setting Fly.io Secrets

## Quick Setup

### Option 1: Interactive Script (Recommended)

Run the PowerShell script that will guide you through setting all secrets:

```powershell
cd backend
.\set-secrets.ps1
```

The script will:
- Prompt you for each required secret
- Set them automatically in Fly.io
- Show you optional secrets you can add

### Option 2: Manual Setup

Set secrets one by one using `flyctl secrets set`:

```powershell
# Required secrets
flyctl secrets set DATABASE_URL="postgresql://user:password@host:port/database" --app tide-raider-backend
flyctl secrets set NEXTAUTH_SECRET="your-nextauth-secret-key" --app tide-raider-backend
flyctl secrets set FRONTEND_URL="https://your-frontend.vercel.app" --app tide-raider-backend
flyctl secrets set CRON_SECRET="your-cron-secret-key" --app tide-raider-backend
flyctl secrets set NODE_ENV="production" --app tide-raider-backend

# Google OAuth (Required for authentication)
flyctl secrets set GOOGLE_CLIENT_ID="your-google-client-id" --app tide-raider-backend
flyctl secrets set GOOGLE_CLIENT_SECRET="your-google-client-secret" --app tide-raider-backend
flyctl secrets set BACKEND_URL="https://tide-raider-backend.fly.dev" --app tide-raider-backend

# Optional (if using notifications)
flyctl secrets set RESEND_API_KEY="your-resend-key" --app tide-raider-backend
flyctl secrets set MESSAGEBIRD_API_KEY="your-messagebird-key" --app tide-raider-backend
```

### Option 3: Set Multiple at Once

You can set multiple secrets in one command:

```powershell
flyctl secrets set \
  DATABASE_URL="postgresql://..." \
  NEXTAUTH_SECRET="your-secret" \
  FRONTEND_URL="https://your-app.vercel.app" \
  CRON_SECRET="your-cron-secret" \
  NODE_ENV="production" \
  GOOGLE_CLIENT_ID="your-google-client-id" \
  GOOGLE_CLIENT_SECRET="your-google-client-secret" \
  BACKEND_URL="https://tide-raider-backend.fly.dev" \
  --app tide-raider-backend
```

## Required Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Must match your frontend NextAuth secret | `your-random-secret-key` |
| `FRONTEND_URL` | Your frontend URL for CORS | `https://your-app.vercel.app` |
| `CRON_SECRET` | Secret for cron job authentication | `your-cron-secret-key` |
| `NODE_ENV` | Environment (always "production") | `production` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | From Google Cloud Console |
| `BACKEND_URL` | Backend URL for OAuth callback | `https://tide-raider-backend.fly.dev` |

## Where to Get Values

### DATABASE_URL
- If using Fly Postgres: `flyctl postgres connect -a your-postgres-app`
- If using external DB: Get from your database provider
- Format: `postgresql://user:password@host:port/database?sslmode=require`

### NEXTAUTH_SECRET
- Must match the secret in your frontend `.env.local`
- Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### FRONTEND_URL
- Your Vercel deployment URL
- Example: `https://tide-raider.vercel.app`

### CRON_SECRET
- Any long random string you create
- Used to secure the cron endpoint
- Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## View Current Secrets

```powershell
flyctl secrets list --app tide-raider-backend
```

## Remove a Secret

```powershell
flyctl secrets unset SECRET_NAME --app tide-raider-backend
```

## Important Notes

1. **Secrets are encrypted** - They're stored securely by Fly.io
2. **No quotes needed** - Fly.io handles quoting automatically
3. **App must exist** - Create the app first: `flyctl apps create tide-raider-backend`
4. **Secrets take effect immediately** - No need to redeploy after setting secrets

## After Setting Secrets

1. Verify secrets are set:
   ```powershell
   flyctl secrets list --app tide-raider-backend
   ```

2. Deploy your app:
   ```powershell
   flyctl deploy
   ```

3. Check logs to verify secrets are loaded:
   ```powershell
   flyctl logs --app tide-raider-backend
   ```

