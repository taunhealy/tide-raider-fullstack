# Corrected Vercel Environment Variables

## ❌ REMOVE THESE:
- `AUTH_URL="http://localhost:3000"` - **REMOVE** (causing callback errors)
- `DATABASE_URL="postgresql://..."` - **REMOVE** (pgbouncer not accessible from Vercel, frontend shouldn't connect directly)

## ✅ KEEP THESE (All Good):
- `SANITY_WRITE_TOKEN`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_SANITY_STUDIO_URL`
- `NEXTAUTH_SECRET` (or remove if using AUTH_SECRET)
- `AUTH_SECRET` (keep this, newer name)
- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_BASE_URL="https://www.tideraider.com"`
- `ADMIN_EMAIL`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_AWS_REGION`
- `NEXT_PUBLIC_AWS_BUCKET_NAME`
- `SURF_URL`
- `AUTH_TRUST_HOST="true"`
- `USE_DATABASE="true"`
- `API_KEY` (Google Maps)
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- All other API keys and tokens

## ➕ ADD THIS:
- `NEXT_PUBLIC_API_URL="https://tide-raider-backend.fly.dev"` - **REQUIRED** for backend proxy

## ⚠️ OPTIONAL (Can Remove):
- `NEXTAUTH_URL` - Can be removed, NextAuth auto-detects it. If you keep it, set to: `https://www.tideraider.com`

## Summary of Changes:
1. **Remove** `AUTH_URL="http://localhost:3000"`
2. **Remove** `DATABASE_URL="postgresql://..."`
3. **Add** `NEXT_PUBLIC_API_URL="https://tide-raider-backend.fly.dev"`
4. **Optional**: Remove `NEXTAUTH_URL` (or keep it set to production URL)

