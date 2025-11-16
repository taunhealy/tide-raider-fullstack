# Testing Guide: Backend + Frontend Integration

## Setup Status

✅ **Backend is configured to work with Next.js frontend:**

- CORS is enabled for `http://localhost:3000` (or `FRONTEND_URL`)
- Cookie parser is set up for NextAuth session tokens
- Authentication middleware validates JWT tokens from NextAuth
- API client is ready in the frontend

## Quick Start Testing

### 1. Start Backend Server

```bash
cd backend

# Install dependencies (first time only)
npm install

# Generate Prisma client (first time only)
npm run prisma:generate

# Start development server
npm run dev
```

Backend should start on `http://localhost:3001`

### 2. Start Frontend Server

```bash
cd next

# Install dependencies (if needed)
npm install

# Set environment variable
# Create or update .env.local:
NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev
```

Frontend should start on `http://localhost:3000`

## Testing Endpoints

### 1. Health Check (No Auth Required)

```bash
# Using curl
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. Test from Frontend Console

Open browser console on `http://localhost:3000` and run:

```javascript
// Test health endpoint
fetch("http://localhost:3001/health")
  .then((r) => r.json())
  .then(console.log);

// Test beaches endpoint (no auth required)
fetch("http://localhost:3001/api/beaches")
  .then((r) => r.json())
  .then(console.log);
```

### 3. Test with API Client

In a React component or page:

```typescript
import api from "@/app/lib/api-client";

// In a component
const testBackend = async () => {
  try {
    // Health check
    const health = await api.health();
    console.log("Health:", health);

    // Get beaches
    const { beaches } = await api.getBeaches();
    console.log("Beaches:", beaches);
  } catch (error) {
    console.error("API Error:", error);
  }
};
```

## Testing Authentication

### 1. Get NextAuth Session Token

The backend expects JWT tokens from NextAuth. To test authenticated endpoints:

**Option A: Use Browser (Easiest)**

1. Log in to your Next.js app at `http://localhost:3000`
2. Open browser DevTools → Application → Cookies
3. Find the `next-auth.session-token` cookie
4. Copy its value

**Option B: Get Token from NextAuth API**

```bash
# After logging in, get session
curl http://localhost:3000/api/auth/session \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN_HERE"
```

### 2. Test Authenticated Endpoint

```bash
# Using the token from cookies
curl http://localhost:3001/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN_HERE"
```

Or in browser console (cookies are sent automatically):

```javascript
// This will use cookies automatically
fetch("http://localhost:3001/api/alerts", {
  credentials: "include",
})
  .then((r) => r.json())
  .then(console.log);
```

## Testing Specific Features

### Test Alerts

```bash
# Get user's alerts (requires auth)
curl http://localhost:3001/api/alerts \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Create an alert (requires auth)
curl -X POST http://localhost:3001/api/alerts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "name": "Perfect Swell Alert",
    "regionId": "region-id",
    "notificationMethod": "email",
    "contactInfo": "user@example.com",
    "alertType": "VARIABLES",
    "properties": [{
      "property": "swellHeight",
      "optimalValue": 2.5,
      "range": 0.5
    }]
  }'

# Process alerts for a user
curl -X POST http://localhost:3001/api/alerts/notify \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}'
```

### Test Logs

```bash
# Get user's logs (requires auth)
curl http://localhost:3001/api/logs \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Create a log entry
curl -X POST http://localhost:3001/api/logs \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "date": "2024-01-01",
    "region": "region-id",
    "forecast": {
      "windSpeed": 10,
      "windDirection": 180,
      "swellHeight": 2.5,
      "swellPeriod": 12,
      "swellDirection": 200
    }
  }'
```

### Test Raid Logs

```bash
# Get raid logs with filters
curl "http://localhost:3001/api/raid-logs?regionId=region-id&minRating=3&page=1&limit=10"

# Get forecast for a region and date
curl "http://localhost:3001/api/raid-logs/forecast?region=region-id&date=2024-01-01"
```

## Common Issues & Solutions

### Issue: CORS Error

**Error:** `Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**

1. Check `backend/.env` has `FRONTEND_URL=http://localhost:3000`
2. Restart backend server
3. Verify CORS middleware is loaded in `backend/src/server.ts`

### Issue: 401 Unauthorized

**Error:** `{ "error": "Authentication required" }`

**Solution:**

1. Make sure you're logged in to the Next.js app
2. Check that `NEXTAUTH_SECRET` matches in both frontend and backend `.env` files
3. Verify the session token cookie is being sent (check browser DevTools)

### Issue: Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'` or type errors

**Solution:**

```bash
cd backend
npm run prisma:generate
```

### Issue: Database Connection Error

**Error:** `Can't reach database server`

**Solution:**

1. Check `DATABASE_URL` in `backend/.env`
2. Verify database is running and accessible
3. Test connection: `npm run prisma:studio` (if it opens, connection works)

## Integration Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Health endpoint responds: `GET /health`
- [ ] CORS allows frontend origin
- [ ] Public endpoints work: `GET /api/beaches`
- [ ] Authentication works: Can access protected endpoints with session
- [ ] Alerts endpoints work: Create, read, update, delete alerts
- [ ] Logs endpoints work: Create and read logs
- [ ] Raid logs endpoints work: List, create, update, delete
- [ ] Alert processing works: `POST /api/alerts/notify`

## Next Steps

1. **Update Frontend Components**: Replace direct API calls to `/api/*` with `api-client` calls
2. **Add Error Handling**: Implement proper error handling in frontend
3. **Add Loading States**: Show loading indicators during API calls
4. **Test in Production**: Deploy backend to Fly.io and test with production frontend

## Debugging Tips

### Enable Backend Logging

Backend already logs to console. Watch for:

- `🚀 Backend server running on port 3001`
- `📡 Environment: development`
- Request logs (if you add middleware)
- Error logs

### Enable Frontend Logging

In browser console, you'll see:

- API request errors
- Network tab shows all requests
- Check for CORS preflight requests

### Test with Postman/Insomnia

1. Import collection or create requests manually
2. Set base URL: `http://localhost:3001`
3. For auth, add cookie: `next-auth.session-token=YOUR_TOKEN`
4. Or use Authorization header: `Bearer YOUR_TOKEN`

## Production Testing

Once deployed:

1. **Backend on Fly.io:**

   ```bash
   fly deploy
   fly logs
   ```

2. **Update Frontend Environment:**

   ```env
   NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev
   ```

3. **Test Production Endpoints:**
   ```bash
   curl https://tide-raider-backend.fly.dev/health
   ```
