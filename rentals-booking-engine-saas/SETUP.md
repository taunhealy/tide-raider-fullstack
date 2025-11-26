# Quick Setup Guide

## 📋 Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (or any Postgres database)
- Google OAuth credentials
- PayPal developer account
- WeatherAPI.com account

## 🚀 Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Backend Environment

Create `packages/booking-engine/.env`:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/dbname"
PRISMA_ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY"

# Auth
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"

# PayPal
PAYPAL_MODE="sandbox"

# Weather
WEATHER_API_KEY="your-weatherapi-key"

# Encryption
ENCRYPTION_KEY="$(openssl rand -hex 32)"

# Server
PORT=8080
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Setup Frontend Environment

Create `packages/client-website/.env.local`:

```bash
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXTAUTH_SECRET="same-as-backend"
NEXTAUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="same-as-backend"
AUTH_GOOGLE_SECRET="same-as-backend"
DATABASE_URL="same-as-backend"
```

### 4. Initialize Database

```bash
cd packages/booking-engine

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with test data
npm run db:seed
```

### 5. Start Development Servers

```bash
# From root directory
npm run dev
```

This starts:
- **Backend**: http://localhost:8080
- **Frontend**: http://localhost:3000

### 6. Verify Setup

1. Visit http://localhost:8080/health - Should return `{"status":"ok"}`
2. Visit http://localhost:3000 - Should show homepage
3. Check Prisma Studio: `cd packages/booking-engine && npx prisma studio`

## 🔑 Getting API Keys

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### PayPal

1. Go to [PayPal Developer](https://developer.paypal.com)
2. Create a sandbox app
3. Copy Client ID and Secret
4. Test with sandbox accounts

### WeatherAPI.com

1. Sign up at [WeatherAPI.com](https://www.weatherapi.com)
2. Get free API key (1M calls/month)

### Prisma Accelerate (Optional)

1. Sign up at [Prisma Data Platform](https://cloud.prisma.io)
2. Create a project
3. Get Accelerate connection string

## 🗄️ Database Schema

The schema includes:
- Multi-tenant architecture (Company model)
- Users & Auth (next-auth v5 compatible)
- Listings (rentals inventory)
- Bookings & Payments
- Weather-based pricing rules
- Reviews & ratings
- Webhook event logs

## 🎯 Next Steps

### Stage 1 MVP Tasks:

1. **Implement tRPC routes**
   - Listings CRUD
   - Booking creation
   - Payment processing

2. **Build frontend components**
   - Listing cards
   - Booking form
   - Payment checkout

3. **Setup authentication**
   - Google OAuth flow
   - Session management
   - Protected routes

4. **Integrate PayPal**
   - Admin dashboard for credentials
   - Order creation flow
   - Webhook handling

5. **Deploy**
   - Backend to Cloud Run
   - Frontend to Vercel
   - Database on Supabase

## 📚 Architecture Decisions

### Why Monorepo (Turborepo)?
- Shared types between frontend/backend
- Unified dependency management
- Faster builds with caching

### Why tRPC?
- End-to-end type safety
- No code generation needed
- React Query integration

### Why Prisma Accelerate?
- Global edge caching
- Connection pooling
- Reduced latency

### Why Encrypted Credentials?
- Secure multi-tenant storage
- Client credentials never exposed
- Platform doesn't handle money directly

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 8080
npx kill-port 8080

# Or use different port
PORT=8081 npm run dev
```

### Prisma client errors
```bash
cd packages/booking-engine
npx prisma generate
```

### TypeScript errors
```bash
npm run type-check
```

## 📖 Documentation

- [Prisma Docs](https://www.prisma.io/docs)
- [tRPC Docs](https://trpc.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [PayPal API Docs](https://developer.paypal.com/api/rest/)
- [WeatherAPI Docs](https://www.weatherapi.com/docs/)

---

**Ready to build!** 🚀

