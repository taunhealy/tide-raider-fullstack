# Setup Summary: Backend + Frontend Split

## ✅ Completed

### Backend Setup (Fly.io)
- [x] Created Express.js server structure
- [x] Set up TypeScript configuration
- [x] Moved Prisma schema and migrations to backend
- [x] Created authentication middleware (JWT validation)
- [x] Set up CORS, rate limiting, and error handling
- [x] Created Dockerfile for Fly.io deployment
- [x] Created fly.toml configuration
- [x] Copied scrapers to backend
- [x] Created sample API route (beaches) as example

### Frontend Setup (Vercel)
- [x] Created API client utility (`api-client.ts`)
- [x] Created API configuration (`api-config.ts`)
- [x] Set up structure for calling backend API

### Documentation
- [x] Created migration guide
- [x] Created API route migration helper
- [x] Created environment variable examples

## 🔄 In Progress

### Backend
- [ ] Move all API routes from `next/app/api/` to `backend/src/routes/`
- [ ] Move background jobs/cron tasks to backend
- [ ] Set up cron job scheduling on Fly.io (or external service)
- [ ] Copy additional utilities needed by API routes

### Frontend
- [ ] Update all components to use `api-client` instead of direct API calls
- [ ] Remove or deprecate Next.js API routes (keep for gradual migration)
- [ ] Update environment variables

## 📋 Next Steps

### 1. Continue API Route Migration

For each route in `next/app/api/`:
1. Create Express route in `backend/src/routes/`
2. Convert Next.js handler to Express handler
3. Register route in `backend/src/routes/index.ts`
4. Update frontend to use `api-client`

**Priority routes to migrate:**
- `/api/user/*` - User management
- `/api/alerts/*` - Alert system
- `/api/forecasts/*` - Forecast data
- `/api/subscriptions/*` - Subscription management
- `/api/webhooks/*` - Webhook handlers

### 2. Move Cron Jobs

Current cron jobs in `vercel.json`:
- `/api/cron/daily-alerts` - Daily at 3 AM

**Options:**
- Use Fly.io cron jobs (if available)
- Use external cron service (e.g., cron-job.org)
- Use node-cron in backend with persistent connection

### 3. Testing

1. **Local testing:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm install
   npm run dev
   
   # Terminal 2: Frontend
   cd next
   npm run dev
   ```

2. **Test API endpoints:**
   - `http://localhost:3001/health` - Health check
   - `http://localhost:3001/api/beaches` - Beaches endpoint

### 4. Deployment

#### Backend (Fly.io)
```bash
cd backend
fly launch
# Follow prompts, then:
fly secrets set DATABASE_URL=your_database_url
fly secrets set NEXTAUTH_SECRET=your_secret
fly secrets set FRONTEND_URL=https://your-app.vercel.app
# ... set other secrets
fly deploy
```

#### Frontend (Vercel)
1. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://tide-raider-backend.fly.dev`
2. Deploy as usual

## 🔧 Configuration

### Backend Environment Variables
See `backend/.env.example` for full list. Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - JWT secret (must match frontend)
- `FRONTEND_URL` - CORS origin
- `UPSTASH_REDIS_REST_URL` - Redis (optional)
- `UPSTASH_REDIS_REST_TOKEN` - Redis token (optional)

### Frontend Environment Variables
- `NEXT_PUBLIC_API_URL` - Backend API URL
- All existing NextAuth and other configs remain

## 📝 Notes

### Authentication Flow
1. User authenticates via NextAuth on frontend
2. Frontend receives JWT token (stored in cookie)
3. Frontend sends token in Authorization header or cookies to backend
4. Backend validates token using `NEXTAUTH_SECRET`
5. Backend middleware attaches user to request

### CORS
- Backend allows requests from `FRONTEND_URL`
- Credentials (cookies) are included
- All preflight requests are handled

### Rate Limiting
- General: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes
- Webhooks: 20 requests per minute

## 🚨 Important Reminders

1. **Keep NextAuth on frontend** - It's Next.js specific
2. **Backend validates JWT** - Uses same `NEXTAUTH_SECRET`
3. **Gradual migration** - Can migrate routes one at a time
4. **Git branches** - Use `split-backend-frontend` branch for this work
5. **Rollback plan** - `main` branch has original architecture

## 📚 Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Next.js API Routes → Express Migration](scripts/migrate-api-route.md)
- [Full Migration Guide](MIGRATION_GUIDE.md)

