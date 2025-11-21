# Local Testing Guide - Google OAuth

This guide will help you set up and test Google OAuth authentication locally.

## Prerequisites

1. **Docker Desktop** must be running
2. **Backend server** must be running on port 4001
3. **Next.js frontend** must be running on port 3000
4. **Google OAuth credentials** must be configured

## Step 1: Start the Backend Server

```bash
cd backend

# Start Docker Postgres (if not already running)
npm run db:start

# Make sure you have a .env file with required variables
# See backend/.env.example or backend/README.md

# Start the backend server
npm run dev
```

The backend should be running at `http://localhost:4001`

**Verify backend is running:**
```bash
curl http://localhost:4001/health
```

## Step 2: Configure Backend Environment Variables

Create or update `backend/.env`:

```env
# Database (use Docker Postgres for local dev)
DATABASE_URL="postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev?schema=public"

# Server
NODE_ENV=development
PORT=4001

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-key-here
AUTH_SECRET=your-auth-secret-key-here

# Frontend URL (where OAuth redirects after login)
FRONTEND_URL=http://localhost:3000

# Google OAuth (REQUIRED for OAuth to work)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend URL (for OAuth callback)
BACKEND_URL=http://localhost:4001
```

## Step 3: Configure Google OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** > **Credentials**
4. Create OAuth 2.0 Client ID (if you don't have one)
5. Configure **Authorized JavaScript origins**:
   - `http://localhost:3000` (for frontend)
   - `http://localhost:4001` (for backend)
6. Configure **Authorized redirect URIs**:
   - `http://localhost:4001/api/auth/google/callback` (for local backend)

**Important:** The redirect URI must EXACTLY match: `http://localhost:4001/api/auth/google/callback`

## Step 4: Configure Frontend Environment Variables

Create or update `next/.env.local`:

```env
# Backend API URL (for local development)
NEXT_PUBLIC_API_URL=http://localhost:4001

# NextAuth (if still using NextAuth for other features)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here
```

## Step 5: Start the Frontend

```bash
cd next

# Install dependencies (if needed)
npm install

# Start the development server
npm run dev
```

The frontend should be running at `http://localhost:3000`

## Step 6: Test OAuth Flow

1. Open `http://localhost:3000` in your browser
2. Click "Sign In" or "Login with Google"
3. You should be redirected to Google's OAuth consent screen
4. After authorizing, you should be redirected back to the frontend

## Troubleshooting

### Error: "Backend server not found"

**Problem:** The frontend can't reach the backend at `http://localhost:4001`

**Solutions:**
1. Verify backend is running:
   ```bash
   curl http://localhost:4001/health
   ```
2. Check `NEXT_PUBLIC_API_URL` in `next/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4001
   ```
3. Restart the Next.js dev server after changing `.env.local`

### Error: "OAuth not configured"

**Problem:** Backend doesn't have Google OAuth credentials

**Solutions:**
1. Check `backend/.env` has:
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
2. Restart the backend server after adding credentials
3. Verify credentials are correct in Google Cloud Console

### Error: "redirect_uri_mismatch"

**Problem:** Google OAuth redirect URI doesn't match

**Solutions:**
1. In Google Cloud Console, add exactly:
   ```
   http://localhost:4001/api/auth/google/callback
   ```
2. Make sure there are no trailing slashes
3. Wait a few minutes for Google to update the configuration

### Backend won't start

**Problem:** Database connection issues

**Solutions:**
1. Make sure Docker Desktop is running
2. Start the database:
   ```bash
   cd backend
   npm run db:start
   ```
3. Check database is ready:
   ```bash
   docker ps
   ```
4. Verify `DATABASE_URL` in `backend/.env` matches Docker setup

### Port already in use

**Problem:** Port 4001 or 3000 is already in use

**Solutions:**
1. Find what's using the port:
   ```bash
   # Windows
   netstat -ano | findstr :4001
   
   # Mac/Linux
   lsof -i :4001
   ```
2. Stop the process or change the port in `.env`

## Quick Test Checklist

- [ ] Docker Desktop is running
- [ ] Backend database is started (`npm run db:start` in backend/)
- [ ] Backend server is running on port 4001
- [ ] Frontend server is running on port 3000
- [ ] `backend/.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] `next/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:4001`
- [ ] Google Cloud Console has redirect URI configured
- [ ] Both servers restarted after env changes

## Alternative: Use Production Backend for OAuth

If you can't set up local OAuth, you can use the production backend for authentication while developing locally:

In `next/.env.local`:
```env
# Use production backend for OAuth only
NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev
```

**Note:** This means your local frontend will authenticate against the production backend, but you can still develop other features locally.

## Testing Without OAuth

If you just want to test other features without OAuth:

1. The backend will return a 503 error for OAuth routes if credentials aren't configured
2. This is expected and won't crash the app
3. You can still test other API endpoints that don't require authentication

