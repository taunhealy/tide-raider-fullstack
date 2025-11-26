# Rentals Booking Engine SaaS

> Multi-tenant luxury adventure booking platform for supercars, yachts, jet-skis, and 4x4 campers in South Africa.

## 🏗️ Architecture

This is a **Turborepo monorepo** with two packages:

```
rentals-booking-engine-saas/
├── packages/
│   ├── booking-engine/       ← Backend (Express + Prisma + tRPC)
│   └── client-website/       ← Frontend (Next.js 15 + shadcn/ui)
```

## 🛠️ Tech Stack

### Backend (`packages/booking-engine`)
- **Runtime**: Node.js 20+ on Google Cloud Run (always-on)
- **Framework**: Express.js + tRPC 11
- **Database**: Supabase Postgres (via Prisma 5.20+ with Accelerator)
- **ORM**: Prisma (multi-tenant architecture)
- **Auth**: next-auth v5 (Google OAuth only)
- **Payment**: PayPal REST API v2
- **Security**: AES-256-GCM encryption for stored credentials
- **Weather**: WeatherAPI.com (dynamic pricing)
- **Rate Limiting**: express-rate-limit

### Frontend (`packages/client-website`)
- **Framework**: Next.js 15 (App Router)
- **UI**: Tailwind CSS 3.4 + shadcn/ui + lucide-react
- **Forms**: react-hook-form + zod
- **Type Safety**: tRPC client
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

```bash
node >= 20.0.0
npm >= 10.0.0
```

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

**Backend** (`packages/booking-engine/.env`):

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/dbname"
PRISMA_ACCELERATE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# PayPal (for admin operations only)
PAYPAL_MODE="sandbox" # or "live"

# Weather API
WEATHER_API_KEY="your-weatherapi-com-key"

# Encryption
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"

# Server
PORT=8080
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

**Frontend** (`packages/client-website/.env.local`):

```bash
NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXTAUTH_SECRET="same-as-backend"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="same-as-backend"
GOOGLE_CLIENT_SECRET="same-as-backend"
```

### 3. Setup Database

```bash
# Navigate to backend
cd packages/booking-engine

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed database
npm run db:seed
```

### 4. Run Development Servers

```bash
# From root directory
npm run dev
```

This starts:
- **Backend**: http://localhost:8080
- **Frontend**: http://localhost:3000

## 📦 Package Scripts

### Root Commands

```bash
npm run dev          # Start all packages in dev mode
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run format       # Format all files with Prettier
npm run type-check   # TypeScript type checking
npm run clean        # Clean all build artifacts
```

### Backend Commands

```bash
cd packages/booking-engine

npm run dev          # Start Express server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema to database
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Frontend Commands

```bash
cd packages/client-website

npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint Next.js app
```

## 🗄️ Database Schema

Multi-tenant architecture with these core models:

- **User** - End users (customers)
- **Account** - OAuth accounts (Google)
- **Session** - Authentication sessions
- **Company** - Rental companies (tenants)
- **CompanySettings** - Encrypted PayPal credentials per company
- **Listing** - Rental inventory (cars, yachts, jet-skis, etc.)
- **ListingImage** - Product images
- **Booking** - Customer reservations
- **Payment** - PayPal payment records
- **WebhookEvent** - PayPal webhook logs
- **PricingRule** - Dynamic pricing (weather-based)
- **WeatherCache** - Cached weather data
- **Review** - Customer reviews

## 🔐 Security Features

### Multi-Tenant Isolation
- Each company's data is isolated via `companyId` foreign keys
- Row-level security via Prisma queries
- No cross-company data access

### PayPal Credential Storage
- Client PayPal credentials stored encrypted (AES-256-GCM)
- Decrypted on-demand for order creation
- Never exposed to frontend
- Direct payment flow (money goes to client, not platform)

### Authentication
- Google OAuth only (no passwords)
- next-auth v5 with secure sessions
- CSRF protection built-in

## 💳 Payment Flow

1. Customer selects rental and dates
2. Frontend calls tRPC `booking.create` mutation
3. Backend retrieves company's encrypted PayPal keys
4. Backend calls PayPal API to create order
5. Customer completes checkout on PayPal
6. PayPal webhook confirms payment
7. Backend updates booking status
8. Confirmation email sent (future)
9. **Money goes directly to rental company**

## 🌤️ Dynamic Pricing

Weather-based pricing rules:
- Fetch weather for rental location
- Apply pricing multipliers (e.g., sunny = 1.2x)
- Cache weather data (15-min TTL)
- Real-time price updates via Cloud Run

## 📁 Folder Structure

```
rentals-booking-engine-saas/
├── packages/
│   ├── booking-engine/
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Multi-tenant database schema
│   │   │   └── seed.ts             # Seed data
│   │   ├── src/
│   │   │   ├── index.ts            # Express server entry
│   │   │   ├── trpc/               # tRPC router setup
│   │   │   ├── routes/             # Express routes
│   │   │   ├── services/           # Business logic
│   │   │   ├── lib/                # Utilities (encryption, PayPal, weather)
│   │   │   └── middleware/         # Auth, rate limiting
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── client-website/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── (auth)/             # Auth routes
│       │   ├── (dashboard)/        # Company dashboard
│       │   └── api/                # Next.js API routes (auth)
│       ├── components/
│       │   ├── ui/                 # shadcn/ui components
│       │   └── booking/            # Booking-specific components
│       ├── lib/
│       │   └── trpc.ts             # tRPC client setup
│       ├── public/
│       ├── styles/
│       │   └── globals.css
│       ├── .env.example
│       ├── next.config.js
│       ├── package.json
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── turbo.json
├── package.json
└── README.md
```

## 🚢 Deployment

### Backend (Google Cloud Run)

```bash
cd packages/booking-engine

# Build container
gcloud builds submit --config cloudbuild.yaml

# Deploy (always-on)
gcloud run deploy booking-engine-api \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 10 \
  --set-env-vars DATABASE_URL=...,ENCRYPTION_KEY=...
```

### Frontend (Vercel)

```bash
cd packages/client-website

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🧪 Testing (Future)

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📝 Stage 1 MVP Scope

**Implemented**:
- ✅ Multi-tenant database schema
- ✅ Encrypted PayPal credential storage
- ✅ PayPal order creation
- ✅ PayPal webhook handling
- ✅ Booking allocation
- ✅ Direct payment to client (no platform middleman)

**Not Yet Implemented**:
- ⏳ Dynamic weather pricing
- ⏳ Email confirmations
- ⏳ Review system
- ⏳ Advanced admin dashboard
- ⏳ Mobile app

## 🤝 Contributing

This is a private SaaS platform. Contact the team for access.

## 📄 License

Proprietary - All rights reserved.

---

**Built with ❤️ for South African adventure rental companies**

