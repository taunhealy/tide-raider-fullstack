# System Architecture

## 🏗️ Complete Folder Structure

```
rentals-booking-engine-saas/
├── packages/
│   ├── booking-engine/                 # Backend (Express + Prisma + tRPC)
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # Multi-tenant database schema
│   │   │   └── seed.ts                # Database seed script
│   │   ├── src/
│   │   │   ├── index.ts               # Express server entry point
│   │   │   ├── lib/
│   │   │   │   ├── encryption.ts      # AES-256-GCM encryption
│   │   │   │   ├── paypal.ts          # PayPal REST API v2 client
│   │   │   │   └── weather.ts         # WeatherAPI.com client
│   │   │   ├── middleware/
│   │   │   │   └── rateLimit.ts       # express-rate-limit config
│   │   │   ├── routes/                # (Future) Express routes
│   │   │   ├── services/              # (Future) Business logic
│   │   │   └── trpc/                  # (Future) tRPC routers
│   │   ├── .env.example
│   │   ├── .dockerignore
│   │   ├── Dockerfile                 # Cloud Run deployment
│   │   ├── cloudbuild.yaml            # Google Cloud Build config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── client-website/                # Frontend (Next.js 15)
│       ├── app/
│       │   ├── layout.tsx             # Root layout
│       │   ├── page.tsx               # Homepage
│       │   ├── globals.css            # Tailwind globals
│       │   ├── (auth)/                # (Future) Auth routes
│       │   ├── (dashboard)/           # (Future) Company dashboard
│       │   └── api/                   # (Future) Next.js API routes
│       ├── components/
│       │   ├── ui/
│       │   │   └── button.tsx         # shadcn/ui Button
│       │   └── booking/               # (Future) Booking components
│       ├── lib/
│       │   ├── utils.ts               # cn() utility
│       │   └── trpc.ts                # (Future) tRPC client
│       ├── public/                    # Static assets
│       ├── styles/                    # Additional styles
│       ├── .env.example
│       ├── .vercelignore
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── .vscode/
│   └── settings.json                  # VSCode workspace settings
│
├── .eslintrc.json                     # Shared ESLint config
├── .prettierrc                        # Prettier config
├── .prettierignore
├── .gitignore
├── .nvmrc                             # Node version (20.11.0)
├── .node-version
├── turbo.json                         # Turborepo config
├── tsconfig.json                      # Base TypeScript config
├── package.json                       # Root package.json
├── README.md                          # Main documentation
├── SETUP.md                           # Quick setup guide
├── ARCHITECTURE.md                    # This file
└── LICENSE                            # Proprietary license
```

## 🎯 Tech Stack Details

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| Express.js | ^4.19 | Web framework |
| Prisma | ^5.20 | ORM + migrations |
| tRPC | ^11.0 | Type-safe API |
| TypeScript | ^5.5 | Language |
| Zod | ^3.23 | Validation |
| express-rate-limit | ^7.4 | Rate limiting |
| helmet | ^7.1 | Security headers |
| cors | ^2.8 | CORS handling |

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | ^15.0 | React framework |
| React | ^18.3 | UI library |
| TypeScript | ^5.5 | Language |
| Tailwind CSS | ^3.4 | Styling |
| shadcn/ui | latest | UI components |
| lucide-react | ^0.441 | Icons |
| react-hook-form | ^7.53 | Forms |
| Zod | ^3.23 | Validation |
| @tanstack/react-query | ^5.56 | Data fetching |
| tRPC React | ^11.0 | Type-safe API client |
| next-auth | ^5.0-beta | Authentication |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Supabase Postgres | Database |
| Prisma Accelerate | Edge caching & connection pooling |
| Google Cloud Run | Backend hosting (always-on) |
| Vercel | Frontend hosting |
| PayPal REST API v2 | Payment processing |
| WeatherAPI.com | Dynamic pricing |
| Google OAuth | Authentication |

## 🔄 Data Flow

### Booking Creation Flow

```
┌─────────────┐
│   Customer  │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Select listing + dates
       ▼
┌─────────────────────┐
│   Next.js Frontend  │
│   (Vercel)          │
└──────┬──────────────┘
       │
       │ 2. tRPC mutation: booking.create
       ▼
┌─────────────────────┐
│   Express Backend   │
│   (Cloud Run)       │
└──────┬──────────────┘
       │
       │ 3. Fetch company settings
       ▼
┌─────────────────────┐
│  Prisma + Postgres  │
│  (Supabase)         │
└──────┬──────────────┘
       │
       │ 4. Decrypt PayPal credentials
       ▼
┌─────────────────────┐
│  Encryption Library │
│  (AES-256-GCM)      │
└──────┬──────────────┘
       │
       │ 5. Create PayPal order
       ▼
┌─────────────────────┐
│   PayPal API v2     │
└──────┬──────────────┘
       │
       │ 6. Return approval URL
       ▼
┌─────────────────────┐
│   Customer          │
│   (PayPal Checkout) │
└──────┬──────────────┘
       │
       │ 7. Complete payment
       ▼
┌─────────────────────┐
│   PayPal Webhook    │
└──────┬──────────────┘
       │
       │ 8. POST /webhooks/paypal
       ▼
┌─────────────────────┐
│   Express Backend   │
└──────┬──────────────┘
       │
       │ 9. Update booking status
       ▼
┌─────────────────────┐
│  Database           │
└──────┬──────────────┘
       │
       │ 10. Send confirmation email (future)
       ▼
┌─────────────────────┐
│   Customer          │
└─────────────────────┘
```

### Dynamic Pricing Flow

```
┌─────────────┐
│   Customer  │
│  Views Listing│
└──────┬──────┘
       │
       │ 1. GET /listings/:id
       ▼
┌─────────────────────┐
│   Backend           │
└──────┬──────────────┘
       │
       │ 2. Check weather cache
       ▼
┌─────────────────────┐
│  WeatherCache       │
│  (15-min TTL)       │
└──────┬──────────────┘
       │
       │ 3. If expired, fetch weather
       ▼
┌─────────────────────┐
│  WeatherAPI.com     │
└──────┬──────────────┘
       │
       │ 4. Apply pricing rules
       ▼
┌─────────────────────┐
│  PricingRule        │
│  (e.g., sunny +20%) │
└──────┬──────────────┘
       │
       │ 5. Return dynamic price
       ▼
┌─────────────────────┐
│   Frontend          │
└─────────────────────┘
```

## 🔐 Security Architecture

### Multi-Tenant Isolation

```typescript
// Every query is scoped to companyId
const listings = await prisma.listing.findMany({
  where: {
    companyId: "company-123",
    status: "ACTIVE",
  },
});
```

### PayPal Credential Encryption

```typescript
// Storage
const encrypted = encrypt(paypalClientSecret);
await prisma.companySettings.update({
  where: { companyId },
  data: { paypalClientSecret: encrypted },
});

// Usage
const credentials = decryptPayPalCredentials(
  settings.paypalClientId,
  settings.paypalClientSecret,
  settings.paypalMode
);
```

### Authentication (next-auth v5)

```typescript
// Google OAuth only
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
];
```

## 📊 Database Schema Overview

### Core Models

- **User** - End users (customers + company owners)
- **Account** - OAuth accounts (Google)
- **Session** - Authentication sessions
- **Company** - Rental companies (multi-tenant)
- **CompanySettings** - Encrypted PayPal credentials + business settings
- **Listing** - Rental inventory (supercars, yachts, etc.)
- **ListingImage** - Product images
- **Booking** - Customer reservations
- **Payment** - PayPal payment records
- **WebhookEvent** - PayPal webhook logs
- **PricingRule** - Dynamic pricing rules
- **WeatherCache** - Cached weather data
- **Review** - Customer reviews
- **AuditLog** - System audit trail

### Key Relationships

```
User (1) ─┬─> (N) Account
          ├─> (N) Booking
          ├─> (N) Review
          └─> (N) Company (as owner)

Company (1) ─┬─> (1) CompanySettings
             ├─> (N) Listing
             ├─> (N) Booking
             └─> (N) Review

Listing (1) ─┬─> (N) ListingImage
             ├─> (N) Booking
             ├─> (N) PricingRule
             └─> (N) Review

Booking (1) ─┬─> (N) Payment
             └─> (1) Review (optional)
```

## 🚀 Deployment Architecture

### Production Setup

```
┌───────────────────────────────────────────────────┐
│                    Cloudflare                      │
│              (DNS + DDoS Protection)               │
└─────────────┬──────────────────┬───────────────────┘
              │                  │
              │                  │
       ┌──────▼────────┐  ┌─────▼──────────┐
       │   Vercel      │  │  Cloud Run     │
       │   (Frontend)  │  │  (Backend)     │
       │               │  │  Always-on     │
       │  - Next.js 15 │  │  - Express     │
       │  - Edge Cache │  │  - tRPC        │
       │  - Auto Scale │  │  - Min: 1      │
       └───────┬───────┘  └────────┬───────┘
               │                   │
               │                   │
               │          ┌────────▼────────────┐
               │          │  Prisma Accelerate  │
               │          │  (Connection Pool)  │
               │          └────────┬────────────┘
               │                   │
               │          ┌────────▼────────────┐
               └──────────►  Supabase Postgres  │
                          │  (Database)         │
                          └─────────────────────┘

External APIs:
  - PayPal REST API v2
  - WeatherAPI.com
  - Google OAuth
```

## 📈 Scalability Considerations

### Horizontal Scaling

- **Frontend**: Vercel auto-scales globally
- **Backend**: Cloud Run scales from 1-10 instances
- **Database**: Prisma Accelerate provides connection pooling

### Performance Optimizations

1. **Weather caching** (15-min TTL) reduces API calls
2. **Prisma Accelerate** caches queries at the edge
3. **Next.js ISR** for listing pages
4. **PayPal webhooks** for async payment processing

## 🔮 Future Enhancements (Post-MVP)

### Stage 2
- [ ] Email notifications (Resend/SendGrid)
- [ ] SMS notifications (Twilio)
- [ ] Advanced search (Algolia)
- [ ] Image optimization (Cloudinary)

### Stage 3
- [ ] Mobile app (React Native)
- [ ] Real-time availability (WebSockets)
- [ ] Multi-language support (i18n)
- [ ] Analytics dashboard (Mixpanel)

### Stage 4
- [ ] Marketplace features (platform fees)
- [ ] Insurance integration
- [ ] KYC/ID verification
- [ ] Multi-currency support

---

**Last Updated**: 2025-11-26

