# 🚀 Quick Start Guide

Get your booking engine running in **under 10 minutes**.

---

## ⚡ Express Setup

### 1️⃣ Install Dependencies (2 min)

```bash
cd K:\Kea\tide-raider-fullstack\rentals-booking-engine-saas
npm install
```

This installs all dependencies for both packages using Turborepo's workspace feature.

### 2️⃣ Setup Environment Variables (3 min)

**Backend**: Create `packages/booking-engine/.env`

```bash
# Minimum required for local dev
DATABASE_URL="postgresql://postgres:password@localhost:5432/booking_engine_dev"
DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:5432/booking_engine_dev"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NODE_ENV="development"
PORT=8080
CORS_ORIGIN="http://localhost:3000"
```

**Frontend**: Create `packages/client-website/.env.local`

```bash
NEXT_PUBLIC_API_URL="http://localhost:8080"
```

### 3️⃣ Setup Database (3 min)

```bash
cd packages/booking-engine

# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed with sample data
npm run db:seed
```

### 4️⃣ Start Development Servers (1 min)

```bash
# From root directory
npm run dev
```

**This starts:**
- 🖥️ Backend: http://localhost:8080
- 🌐 Frontend: http://localhost:3000

---

## ✅ Verify Everything Works

### Test Backend
```bash
curl http://localhost:8080/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T...",
  "service": "booking-engine"
}
```

### Test Frontend
Open browser: http://localhost:3000

You should see the homepage with:
- 🏎️ Supercars
- ⛵ Yachts
- 🚤 Jet Skis
- 🚙 4x4 Campers

### View Database (Optional)
```bash
cd packages/booking-engine
npx prisma studio
```

Opens visual database browser at http://localhost:5555

---

## 📁 Project Structure Overview

```
rentals-booking-engine-saas/
├── packages/
│   ├── booking-engine/      ← Backend (Express + Prisma)
│   │   ├── src/index.ts     ← Server entry point
│   │   └── prisma/schema    ← Database schema
│   │
│   └── client-website/      ← Frontend (Next.js 15)
│       └── app/page.tsx     ← Homepage
│
├── README.md                ← Full documentation
├── SETUP.md                 ← Detailed setup guide
└── PROJECT_SUMMARY.md       ← What's been built
```

---

## 🎯 What You Can Do Now

### View Sample Data
- **2 Companies**: Cape Town Supercars, Luxury Yacht Charters
- **2 Listings**: Lamborghini Huracán, 60ft Motor Yacht
- **3 Users**: 2 company owners, 1 customer

### Explore the Database
```bash
cd packages/booking-engine
npx prisma studio
```

Browse all 14 tables:
- User, Account, Session (auth)
- Company, CompanySettings (tenants)
- Listing, ListingImage (inventory)
- Booking, Payment (transactions)
- PricingRule, WeatherCache (dynamic pricing)
- Review, WebhookEvent, AuditLog

---

## 🔧 Common Commands

### Root (Turborepo)
```bash
npm run dev        # Start all packages
npm run build      # Build all packages
npm run lint       # Lint all packages
npm run format     # Format all files
npm run clean      # Clean all build artifacts
```

### Backend
```bash
cd packages/booking-engine

npm run dev        # Start Express server (hot reload)
npm run build      # Build for production
npm run start      # Start production server

npx prisma studio  # Open database GUI
npx prisma generate # Regenerate Prisma Client
npm run db:push    # Push schema changes
npm run db:seed    # Reseed database
```

### Frontend
```bash
cd packages/client-website

npm run dev        # Start Next.js dev server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run Next.js linter
```

---

## 📚 Next Steps

### Stage 1 MVP - Choose Your Path:

#### Option A: Start with Authentication
1. Read [SETUP.md](./SETUP.md) section on Google OAuth
2. Implement next-auth v5 configuration
3. Build login/signup pages

#### Option B: Start with Listings
1. Create tRPC listing router
2. Build listing card components
3. Implement listing detail page

#### Option C: Start with Bookings
1. Create booking form component
2. Implement date picker
3. Build confirmation page

---

## 🐛 Troubleshooting

### "Port 8080 already in use"
```bash
npx kill-port 8080
# Or change PORT in .env
```

### "Cannot find module '@prisma/client'"
```bash
cd packages/booking-engine
npx prisma generate
```

### "Database connection failed"
Make sure your Postgres database is running and `DATABASE_URL` is correct.

### "Turbo command not found"
```bash
npm install -g turbo
# Or use: npx turbo dev
```

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Complete project overview |
| [SETUP.md](./SETUP.md) | Detailed setup instructions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design & tech stack |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | What's been built so far |

---

## 💡 Pro Tips

### 1. Use Prisma Studio
Best way to explore and edit database data visually:
```bash
cd packages/booking-engine
npx prisma studio
```

### 2. Hot Reload Everywhere
Both frontend and backend have hot reload enabled. Just save and watch!

### 3. Type Safety
Changes to Prisma schema automatically flow to backend code:
```bash
npx prisma db push     # Updates DB
npx prisma generate    # Regenerates types
```

### 4. Monorepo Benefits
Shared types between frontend/backend mean:
- No API documentation needed
- Autocomplete everywhere
- Refactor with confidence

---

## 🎉 You're Ready!

Your development environment is configured and running.

**Time to build features!** 🚀

---

*Questions? Check [README.md](./README.md) or [ARCHITECTURE.md](./ARCHITECTURE.md)*

