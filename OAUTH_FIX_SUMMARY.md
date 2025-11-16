# OAuth Fix Summary

## The Problem
- Frontend is still calling NextAuth routes instead of backend OAuth
- NextAuth is trying to connect to Neon database (not accessible)
- `NEXT_PUBLIC_API_URL` is not set in Vercel

## What Was Fixed

1. ✅ Updated `auth-utils.ts` - Now redirects to backend OAuth
2. ✅ Updated signin page - Already redirects to backend
3. ✅ Updated NextAuth route - Intercepts Google OAuth and redirects to backend
4. ✅ Backend OAuth routes are ready

## REQUIRED: Set This in Vercel

**CRITICAL:** Add this environment variable in Vercel:

```
NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev
```

Without this, the frontend defaults to `http://localhost:3001` which won't work in production.

## How It Works Now

1. User clicks "Sign in with Google"
2. Frontend redirects to: `https://tide-raider-backend.fly.dev/api/auth/google`
3. Backend handles OAuth → Google → Backend callback
4. Backend creates user, issues JWT cookie
5. Backend redirects to frontend with cookie
6. Cookie is automatically sent with all API requests

## Next Steps

1. **Set `NEXT_PUBLIC_API_URL` in Vercel** (REQUIRED)
2. **Redeploy Vercel app** for changes to take effect
3. **Test OAuth flow** - Should now go through backend

## Other Issues to Fix Later

- `share-modal.js` error (frontend JS issue)
- `/api/subscription/status` 401 (needs auth cookie)
- Beach fetching error (DATABASE_URL issue - already handled in layout)

