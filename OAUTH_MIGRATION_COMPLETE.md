# OAuth Migration to Backend - Complete ✅

## What Was Done

### Backend Changes
1. ✅ Installed `passport`, `passport-google-oauth20`, and `express-session`
2. ✅ Created `/api/auth/google` route - initiates OAuth flow
3. ✅ Created `/api/auth/google/callback` route - handles OAuth callback, creates user, issues JWT cookie
4. ✅ Updated auth middleware to check `auth-token` cookie (our JWT) first
5. ✅ Added Passport configuration with Google Strategy
6. ✅ Added session middleware for Passport

### Frontend Changes
1. ✅ Updated signin page to redirect to backend OAuth instead of NextAuth
2. ✅ Removed NextAuth dependencies from signin page
3. ✅ API client already uses `credentials: "include"` for cookies

## How It Works Now

1. **User clicks "Sign in with Google"** → Frontend redirects to `BACKEND_URL/api/auth/google`
2. **Backend initiates OAuth** → Redirects to Google OAuth consent screen
3. **User authorizes** → Google redirects to `BACKEND_URL/api/auth/google/callback`
4. **Backend handles callback**:
   - Creates/updates user in database
   - Links Google account
   - Issues JWT token
   - Sets `auth-token` HTTP-only cookie
   - Redirects to frontend with cookie
5. **Frontend receives cookie** → All subsequent API requests automatically include cookie
6. **Backend verifies cookie** → Middleware checks `auth-token` cookie for authentication

## Required Environment Variables

### Backend (Fly.io)
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
BACKEND_URL=https://tide-raider-backend.fly.dev  # Your backend URL
FRONTEND_URL=https://www.tideraider.com  # Your frontend URL
NEXTAUTH_SECRET=your-secret  # For JWT signing
NODE_ENV=production
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev  # Backend URL
```

## Google OAuth Configuration

Update your Google OAuth Client in Google Cloud Console:

**Authorized redirect URIs:**
```
https://tide-raider-backend.fly.dev/api/auth/google/callback
```

For local development:
```
http://localhost:3001/api/auth/google/callback
```

## Testing

1. **Local Development:**
   - Backend: `npm run dev` (runs on port 3001)
   - Frontend: `npm run dev` (runs on port 3000)
   - Visit: `http://localhost:3000/auth/signin`
   - Click "Sign in with Google"
   - Should redirect through backend OAuth and return with cookie

2. **Production:**
   - Deploy backend to Fly.io
   - Deploy frontend to Vercel
   - Visit: `https://www.tideraider.com/auth/signin`
   - Click "Sign in with Google"
   - Should redirect through backend OAuth and return with cookie

## Next Steps (Optional)

1. **Remove NextAuth** (if no longer needed):
   - Can keep it for now as fallback
   - Or remove `next-auth` package and related code

2. **Add logout functionality:**
   - Frontend can call `POST /api/auth/logout` to clear cookie
   - Or just clear cookie client-side

3. **Add user session check:**
   - Frontend can call `GET /api/auth/me` to check if user is logged in
   - Returns user info if authenticated

## Benefits

✅ **Traditional architecture** - Backend handles all auth
✅ **Single database** - All users in one place (Fly Postgres)
✅ **JWT cookies** - Secure, HTTP-only cookies
✅ **No cross-domain issues** - Backend sets cookie, frontend uses it
✅ **Simpler** - No NextAuth complexity

## Notes

- The `auth-token` cookie is HTTP-only, so JavaScript can't access it (more secure)
- Cookie is automatically sent with all requests to the backend
- Backend middleware checks cookie first, then falls back to NextAuth cookies for backward compatibility
- All existing API routes work the same - they check for `auth-token` cookie

