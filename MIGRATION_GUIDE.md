# Migration Guide: Splitting Next.js App into Backend + Frontend

This guide documents the migration from a monolithic Next.js app to a separated backend (Fly.io) and frontend (Vercel) architecture.

## Architecture Overview

### Before
- **Single Next.js app** with API routes in `/app/api`
- All logic (database, scrapers, API) in one codebase
- Deployed to Vercel

### After
- **Backend (Express.js)** on Fly.io
  - All API routes
  - Database access (Prisma)
  - Scrapers and heavy processing
  - Background jobs/cron tasks
  
- **Frontend (Next.js)** on Vercel
  - React components and pages
  - Client-side logic
  - Calls backend API

## Directory Structure

```
tide-raider-fullstack/
├── backend/              # Express.js API (Fly.io)
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── lib/          # Utilities, Prisma, Redis, scrapers
│   │   ├── middleware/   # Auth, error handling, rate limiting
│   │   └── server.ts      # Express server entry point
│   ├── prisma/           # Database schema and migrations
│   ├── Dockerfile        # For Fly.io deployment
│   └── fly.toml          # Fly.io configuration
│
└── next/                 # Next.js frontend (Vercel)
    ├── app/
    │   ├── api/          # (To be removed - use backend instead)
    │   ├── lib/
    │   │   ├── api-client.ts  # Client for backend API
    │   │   └── api-config.ts  # API configuration
    │   └── ...
    └── ...
```

## Migration Steps

### 1. Backend Setup (✅ Completed)

- [x] Created Express.js server structure
- [x] Moved Prisma to backend
- [x] Set up authentication middleware
- [x] Created Fly.io configuration
- [x] Set up CORS and rate limiting

### 2. Move API Routes (In Progress)

For each API route in `next/app/api/`:

1. **Create corresponding route in `backend/src/routes/`**
   - Convert Next.js route handler to Express route
   - Update imports (use `@/lib/prisma` instead of `@/app/lib/prisma`)
   - Handle authentication with `authenticateToken` or `optionalAuth` middleware

2. **Example conversion:**

   **Before (Next.js):**
   ```typescript
   // next/app/api/beaches/route.ts
   import { NextResponse } from "next/server";
   import { prisma } from "@/app/lib/prisma";
   
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url);
     // ... logic
     return NextResponse.json({ beaches });
   }
   ```

   **After (Express):**
   ```typescript
   // backend/src/routes/beaches.ts
   import { Router } from "express";
   import { prisma } from "../lib/prisma";
   
   const router = Router();
   router.get("/", async (req, res) => {
     const { regionId } = req.query;
     // ... logic
     res.json({ beaches });
   });
   ```

3. **Register route in `backend/src/routes/index.ts`**

### 3. Move Heavy Processing (In Progress)

Move to backend:
- [ ] Scrapers (`next/app/lib/scrapers/` → `backend/src/lib/scrapers/`)
- [ ] Background jobs (`next/app/jobs/` → `backend/src/jobs/`)
- [ ] Cron tasks (`next/app/api/cron/` → `backend/src/cron/`)

### 4. Update Frontend (In Progress)

1. **Replace API calls:**
   - Use `api-client.ts` instead of direct fetch to `/api/*`
   - Update all components that call Next.js API routes

2. **Example:**
   ```typescript
   // Before
   const response = await fetch('/api/beaches?regionId=123');
   const data = await response.json();
   
   // After
   import api from '@/app/lib/api-client';
   const { beaches } = await api.getBeaches('123');
   ```

3. **Environment variables:**
   - Add `NEXT_PUBLIC_API_URL` to frontend `.env`
   - Set to backend URL (e.g., `https://tide-raider-backend.fly.dev`)

### 5. Authentication

NextAuth will remain on the frontend, but:
- Backend validates JWT tokens from NextAuth
- Frontend sends session token in Authorization header or cookies
- Backend middleware (`authenticateToken`) verifies tokens

### 6. Deployment

#### Backend (Fly.io)
```bash
cd backend
fly launch
fly secrets set DATABASE_URL=...
fly secrets set NEXTAUTH_SECRET=...
fly deploy
```

#### Frontend (Vercel)
- Update environment variables:
  - `NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev`
- Deploy as usual

## Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
# ... other secrets
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev
# ... other public env vars
```

## Testing

1. **Local development:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd next
   npm run dev
   ```

2. **Test API endpoints:**
   - Backend: `http://localhost:3001/api/beaches`
   - Frontend: `http://localhost:3000` (calls backend)

## Rollback Plan

If the split doesn't work out:

1. **Git branches:**
   - Current architecture: `main` branch
   - Split architecture: `split-backend-frontend` branch

2. **To rollback:**
   ```bash
   git checkout main
   # Deploy from main branch
   ```

3. **All changes are in Git**, so you can always revert to the current architecture.

## Next Steps

1. Continue moving API routes to backend
2. Update frontend components to use `api-client`
3. Test locally
4. Deploy backend to Fly.io
5. Update frontend environment variables
6. Deploy frontend to Vercel
7. Monitor and iterate

## Notes

- Keep NextAuth on frontend (it's Next.js specific)
- Backend validates JWT tokens from NextAuth
- CORS is configured to allow frontend origin
- Rate limiting is applied to all routes
- Error handling is centralized in backend middleware

