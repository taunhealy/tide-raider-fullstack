# Tide Raider Architecture

## Overview

Tide Raider uses a **simple, scalable architecture** with everything running on Cloud Run and Supabase as the database only.

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Vercel (Frontend)               │
│   https://www.tideraider.com            │
│                                         │
│   • Next.js App                         │
│   • React Components                    │
│   • Static Pages                        │
│   • API Proxy Routes                    │
└─────────────────────────────────────────┘
                   │
                   │ HTTPS
                   │ API Calls
                   ▼
┌─────────────────────────────────────────┐
│      Google Cloud Run (Backend)         │
│   https://tide-raider-backend.run.app   │
│                                         │
│   Express.js Server                     │
│   • All API Routes                      │
│   • Authentication (Passport OAuth)     │
│   • Web Scrapers (Playwright/Puppeteer) │
│   • Cron Jobs (node-cron)               │
│   • Business Logic                      │
│   • Background Tasks                    │
└─────────────────────────────────────────┘
                   │
                   │ Prisma ORM
                   │ PostgreSQL Connection
                   ▼
┌─────────────────────────────────────────┐
│      Supabase (Database Only)           │
│   postgresql://db.xxx.supabase.co       │
│                                         │
│   PostgreSQL Database                   │
│   • All application data                │
│   • Managed PostgreSQL                  │
│   • Automatic backups                   │
│   • Connection pooling                  │
└─────────────────────────────────────────┘
```

## Component Breakdown

### Frontend (Vercel)

**Technology**: Next.js 14+ (App Router)

**Responsibilities**:
- User interface (React components)
- Client-side routing
- API client calls to backend
- Static page generation

**Why Vercel?**
- Optimized for Next.js
- Generous free tier
- Global CDN
- Automatic deployments from GitHub

---

### Backend (Cloud Run)

**Technology**: Express.js (Node.js 22)

**Responsibilities**:
- All REST API endpoints
- Authentication (Google OAuth via Passport)
- Web scraping (Windguru, Windfinder, Windy)
- Scheduled cron jobs
- Business logic and data processing
- File uploads/downloads

**Why Cloud Run?**
- Serverless (scales to zero)
- Pay only for what you use
- Generous free tier
- Works with existing Express.js code
- No code changes needed

**Key Features**:
- Auto-scaling (0 to N instances)
- Container-based (Docker)
- Global edge deployment
- Built-in load balancing

---

### Database (Supabase)

**Technology**: PostgreSQL

**Responsibilities**:
- Data storage (all application data)
- Managed PostgreSQL service
- Automatic backups
- Connection pooling

**Why Supabase?**
- Free tier (500 MB)
- PostgreSQL compatible (works with Prisma)
- Easy setup
- Built-in connection pooling
- Auto-pause (saves costs)

**What We're NOT Using**:
- ❌ Supabase Edge Functions (using Cloud Run instead)
- ❌ Supabase Auth (using Passport OAuth on Cloud Run)
- ❌ Supabase Storage (optional)
- ❌ Supabase Realtime (optional)

---

## Data Flow

### 1. User Makes Request

```
User → Vercel Frontend → Cloud Run Backend → Supabase Database
```

### 2. Authentication Flow

```
User clicks "Sign In" 
→ Frontend redirects to Cloud Run OAuth endpoint
→ Cloud Run handles Google OAuth (Passport)
→ Cloud Run creates/updates user in Supabase
→ Cloud Run sets auth cookie
→ User redirected back to frontend
```

### 3. API Request Flow

```
Frontend makes API call
→ Vercel Next.js (optional proxy for same-domain cookies)
→ Cloud Run API endpoint
→ Express.js route handler
→ Prisma ORM queries Supabase
→ Response returned to frontend
```

### 4. Background Jobs Flow

```
Cloud Run Cron Scheduler (node-cron)
→ Triggers scraping job
→ Playwright/Puppeteer scrapes forecast sites
→ Data stored in Supabase via Prisma
→ Alerts processed and notifications sent
```

---

## Why This Architecture?

### ✅ Simplicity

- **One Backend**: All APIs, auth, scrapers, cron in one Express.js app
- **One Database**: Supabase PostgreSQL only
- **No Complexity**: No splitting logic between platforms
- **Easy to Understand**: Clear separation of concerns

### ✅ Scalability

- **Frontend**: Vercel auto-scales globally
- **Backend**: Cloud Run auto-scales 0 to N instances
- **Database**: Supabase scales with plan upgrades
- **Handles**: 100k+ users with proper optimizations

### ✅ Cost-Effective

| Stage | Cost |
|-------|------|
| Development (0-1k users) | $0/month (free tiers) |
| Small (1k-10k users) | $0-25/month |
| Medium (10k-50k users) | $35-50/month |
| Large (50k+ users) | $75-250/month |

### ✅ No Migration Needed

- Your Express.js backend already works
- Just swap database URL
- No code changes required
- No need to rewrite anything

### ✅ Easy Debugging

- All backend logs in Cloud Run
- All database queries visible in Supabase
- Single codebase to maintain
- No cross-platform debugging

---

## Technology Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context / Hooks
- **Deployment**: Vercel

### Backend

- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Authentication**: Passport.js (Google OAuth)
- **Scraping**: Playwright, Puppeteer
- **Scheduling**: node-cron
- **Deployment**: Google Cloud Run

### Database

- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma Client
- **Migrations**: Prisma Migrate
- **Connection**: Connection Pooler (port 6543)

### Infrastructure

- **Frontend Hosting**: Vercel
- **Backend Hosting**: Google Cloud Run
- **Database Hosting**: Supabase
- **CI/CD**: Cloud Build (optional)
- **Secrets**: Google Secret Manager

---

## Scalability Plan

### Stage 1: Development (0-1k users)

- ✅ Free tier (Supabase + Cloud Run)
- ✅ No optimizations needed
- ✅ Single Cloud Run instance

### Stage 2: Small (1k-10k users)

- ✅ Still mostly free tier
- ⚠️ May need Supabase Pro ($25/month) if >500MB
- ✅ Cloud Run auto-scales as needed

### Stage 3: Medium (10k-50k users)

- ✅ Supabase Pro ($25/month)
- ✅ Cloud Run pay-as-you-go (~$10-20/month)
- ✅ Set `--min-instances=1` to eliminate cold starts
- ✅ Use connection pooler for database

### Stage 4: Large (50k+ users)

- ✅ Optimize database queries
- ✅ Add caching layer (Redis) if needed
- ✅ Consider database read replicas
- ✅ Monitor and optimize Cloud Run costs
- ✅ Use CDN for static assets

---

## Security

### Authentication

- Google OAuth via Passport.js (Cloud Run)
- JWT tokens for API authentication
- Secure cookie-based sessions

### Database

- SSL connections required (`?sslmode=require`)
- Credentials stored in Google Secret Manager
- Connection pooling for security

### API Security

- Rate limiting (express-rate-limit)
- CORS configured for frontend only
- Input validation (Zod)
- Error handling (no sensitive data in errors)

---

## Monitoring

### Cloud Run

- Built-in logging and monitoring
- Request metrics
- Error tracking
- Performance monitoring

### Supabase

- Dashboard with query performance
- Database size monitoring
- Connection monitoring
- Backup status

### Frontend

- Vercel analytics (optional)
- Error tracking (Sentry, etc.)
- Performance monitoring

---

## Maintenance

### Regular Tasks

- Monitor Cloud Run costs
- Monitor Supabase usage
- Review logs for errors
- Update dependencies
- Database backups (automatic with Supabase)

### Scaling Tasks

- Upgrade Supabase plan when needed
- Optimize database queries
- Add caching when needed
- Scale Cloud Run resources if needed

---

## Future Considerations

### Potential Additions

- **Redis Cache**: For frequently accessed data
- **CDN**: For static assets (already on Vercel)
- **Monitoring**: Full APM solution (DataDog, New Relic)
- **Analytics**: User behavior tracking
- **Email Service**: SendGrid, Resend, etc.

### Potential Changes

- **Database Read Replicas**: For very high read traffic
- **Separate Scraping Service**: If scraping becomes bottleneck
- **Message Queue**: For background job processing
- **WebSocket Service**: For real-time features (if needed)

But for now, keep it simple! This architecture will scale well.


