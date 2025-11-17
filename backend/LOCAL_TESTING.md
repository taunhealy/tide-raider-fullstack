# Local Backend Testing Guide

This guide will help you run the backend server locally to test OAuth and other features.

## Prerequisites

1. Node.js 22.x installed
2. Database connection (Prisma will use your DATABASE_URL)
3. Google OAuth credentials from Google Cloud Console

## Step 1: Set Up Environment Variables

1. Copy the example environment file:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` and fill in the required values:
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `DATABASE_URL` - Your database connection string
   - `NEXTAUTH_SECRET` or `AUTH_SECRET` - A random secret string (should match frontend)
   - `FRONTEND_URL` - Should be `http://localhost:3000` for local dev

## Step 2: Configure Google Cloud Console for Local Testing

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Open your OAuth 2.0 Client ID
4. Add these to **Authorized redirect URIs**:
   ```
   http://localhost:3001/api/auth/google/callback
   ```
5. Add this to **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```

## Step 3: Install Dependencies

```bash
cd backend
npm install
```

## Step 4: Generate Prisma Client

```bash
npm run prisma:generate
```

## Step 5: Run the Backend Server

### Development Mode (with hot reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## Step 6: Run the Frontend (if testing OAuth)

In a separate terminal:

```bash
cd next
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

## Step 7: Test OAuth Flow

1. Open `http://localhost:3000/auth/signin`
2. Click "Continue with Google"
3. You should be redirected to Google OAuth
4. After authentication, you'll be redirected back to the frontend

## Troubleshooting

### Error: "Cannot find module"

- Run `npm install` in the backend directory
- Run `npm run prisma:generate` to generate Prisma client

### Error: "Database connection failed"

- Check your `DATABASE_URL` in `.env`
- Ensure your database is accessible

### Error: "OAuth not configured"

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Check that the redirect URI in Google Cloud Console matches exactly: `http://localhost:3001/api/auth/google/callback`

### Error: "CORS error"

- Ensure `FRONTEND_URL` in `.env` is set to `http://localhost:3000`
- Check that the frontend is running on port 3000

### OAuth 400: invalid_request

- Verify the redirect URI in Google Cloud Console matches exactly (no trailing slash)
- Check that `http://localhost:3000` is in Authorized JavaScript origins
- Ensure you're using the correct OAuth client (Web application type)

## Environment Variables Reference

| Variable               | Required | Description                 | Example                   |
| ---------------------- | -------- | --------------------------- | ------------------------- |
| `PORT`                 | No       | Server port                 | `3001`                    |
| `NODE_ENV`             | No       | Environment                 | `development`             |
| `FRONTEND_URL`         | Yes      | Frontend URL for CORS       | `http://localhost:3000`   |
| `BACKEND_URL`          | No       | Backend URL (auto-detected) | `http://localhost:3001`   |
| `GOOGLE_CLIENT_ID`     | Yes      | Google OAuth Client ID      | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes      | Google OAuth Client Secret  | From Google Cloud Console |
| `NEXTAUTH_SECRET`      | Yes      | JWT signing secret          | Random string             |
| `DATABASE_URL`         | Yes      | Database connection string  | Prisma format             |

## Testing Endpoints

Once the server is running, you can test:

- Health check: `http://localhost:3001/health`
- Auth test: `http://localhost:3001/api/auth/test`
- OAuth initiate: `http://localhost:3001/api/auth/google`

## Logs

The server logs all requests and responses. Watch the console for:

- `🚀 Backend server running on port 3001`
- `[auth] 🔐 Google OAuth route accessed` (when OAuth is triggered)
- `[auth] 📍 Callback URL: ...` (shows the callback URL being used)

