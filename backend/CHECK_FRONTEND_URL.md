# Check FRONTEND_URL Setting

## Current Status

`FRONTEND_URL` is set in Fly.io, but we need to verify it's the correct value.

## What It Should Be

**Production:** `https://www.tideraider.com`

**NOT:** `http://localhost:3000` (that's only for local development)

## Why This Matters

`FRONTEND_URL` is used for:
1. **CORS** - Allows your frontend to make API requests
2. **OAuth redirects** - Where users are sent after Google sign-in
3. **Error redirects** - Where users are sent on auth errors

If it's set to `localhost:3000`, OAuth will try to redirect to localhost after authentication, which won't work in production.

## Check Current Value

You can't directly view secret values, but you can check the backend logs when OAuth redirects happen to see what URL is being used.

## Update If Needed

If it's not set correctly, update it:

```powershell
flyctl secrets set FRONTEND_URL="https://www.tideraider.com" --app tide-raider-backend
```

This will automatically restart the backend with the new value.

## Verify After Update

After updating, try signing in and check the logs:

```powershell
flyctl logs --app tide-raider-backend --follow
```

When OAuth completes, you should be redirected to `https://www.tideraider.com/raid` (or whatever state parameter was passed).

