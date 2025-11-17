# OAuth Fix - Server Restart Required

## Issue

The OAuth was working earlier but broke after adding secrets. This is because the `GoogleStrategy` is initialized when the server starts, so it needs to be restarted after adding environment variables.

## What I Fixed

1. Updated callback URL detection to also check `FLY_APP_NAME` (Fly.io automatically sets this)
2. This ensures the correct callback URL is used even if `NODE_ENV` isn't explicitly set

## What You Need to Do

### 1. Verify Secrets Are Set

```powershell
flyctl secrets list --app tide-raider-backend
```

Make sure you see:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BACKEND_URL` (should be `https://tide-raider-backend.fly.dev`)
- `FRONTEND_URL` (should be `https://www.tideraider.com`)

### 2. Restart the App

After adding secrets, Fly.io should auto-restart, but let's force a restart to be sure:

```powershell
flyctl apps restart tide-raider-backend
```

Or deploy the updated code:

```powershell
cd backend
flyctl deploy
```

### 3. Check the Logs

After restarting, check the logs to see what callback URL is being used:

```powershell
flyctl logs --app tide-raider-backend --follow
```

Then try to sign in and look for:

- `[auth] 📍 Callback URL: https://tide-raider-backend.fly.dev/api/auth/google/callback`
- `[auth] 🔑 Client ID: ...`

### 4. Verify the Callback URL Matches

The callback URL in the logs must **exactly match** what's in Google Cloud Console:

- Google Cloud Console: `https://tide-raider-backend.fly.dev/api/auth/google/callback`
- Backend logs: Should show the same URL

## Why This Happened

The `GoogleStrategy` is created when the `auth.ts` module loads (when the server starts). If `BACKEND_URL` wasn't set at that time, it would use the fallback logic which might not match your Google Cloud Console configuration.

## Quick Test

1. Restart the app: `flyctl apps restart tide-raider-backend`
2. Wait 30 seconds for it to start
3. Try signing in again
4. Check logs to verify the callback URL is correct
