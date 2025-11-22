# Tide Raider Backend API

Express.js backend API for Tide Raider. Deploy to **Google Cloud Run** with **Supabase PostgreSQL** database.

## Architecture

```
Frontend (Vercel) → Cloud Run (Express.js) → Supabase (PostgreSQL)
```

**Everything runs on Cloud Run:**
- ✅ All API routes
- ✅ Authentication (Passport OAuth)
- ✅ Web scrapers
- ✅ Cron jobs
- ✅ Business logic

**Supabase is used for:**
- ✅ PostgreSQL database only
- ❌ No Edge Functions (all APIs on Cloud Run)
- ❌ No Supabase Auth (using Passport on Cloud Run)

## Development Setup

### Prerequisites

- Node.js 22.x
- Docker and Docker Compose (for local database)
- npm or yarn

### Quick Start

1. **Install dependencies:**

```bash
npm install
```

2. **Start local PostgreSQL database with Docker:**

```bash
# Start the database container
npm run db:start

# Or manually:
docker-compose up -d
```

3. **Set up environment variables:**

Create a `.env` file in the `backend` directory:

```env
# Local Docker Postgres (automatically used when DATABASE_URL is not set)
DATABASE_URL="postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev?schema=public"

# Server
NODE_ENV=development
PORT=3001

# Authentication (generate secure secrets for production)
NEXTAUTH_SECRET=your-nextauth-secret-key
AUTH_SECRET=your-auth-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Cron Security
CRON_SECRET=your-cron-secret-key
```

4. **Generate Prisma Client:**

```bash
npm run prisma:generate
```

5. **Run database migrations:**

```bash
npm run prisma:migrate
```

This will:

- Create the database schema
- Apply all migrations
- Set up the database structure

6. **Seed the database (optional):**

```bash
npm run db:seed
```

## Development

### Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### Database Management

**Start/Stop Database:**

```bash
npm run db:start    # Start Docker Postgres
npm run db:stop     # Stop Docker Postgres
npm run db:restart  # Restart Docker Postgres
npm run db:logs     # View database logs
```

**Database Access:**

```bash
npm run db:studio   # Open Prisma Studio (GUI for database)
```

**Migrations:**

```bash
npm run prisma:migrate        # Create and apply new migration
npm run prisma:migrate:deploy # Apply migrations (production)
```

**Reset Database (⚠️ Deletes all data):**

```bash
npm run db:reset    # Drop database, recreate, and run migrations
```

## Production

Build the project:

```bash
npm run build
```

Start the server:

```bash
npm start
```

## Deployment

### Google Cloud Run + Supabase (Recommended)

Deploy to Google Cloud Run with a Supabase PostgreSQL database. **Everything runs on Cloud Run** (APIs, auth, scrapers, cron), and Supabase is used **only** as the database.

**Quick Start:**
```bash
# Complete setup guide
# See SETUP_SUPABASE_CLOUDRUN.md for step-by-step instructions
```

**Key Benefits:**
- 🆓 **Free tier** for development/testing
- 💰 **$0-25/month** for small apps
- ⚡ Auto-scales to zero (pay only when running)
- 🔄 Simple deployment with Cloud Build
- ✅ **No migration needed** - your Express.js backend already works

**Architecture:**
- Frontend: Vercel (Next.js)
- Backend: Cloud Run (Express.js) - **everything runs here**
- Database: Supabase (PostgreSQL only)

**Cost:**
- Cloud Run: $0/month (free tier: 180k vCPU-seconds, 2M requests)
- Supabase: $0/month (free tier: 500 MB storage)
- **Total: $0/month for development/testing**

**Complete Guides:**
- `SETUP_SUPABASE_CLOUDRUN.md` - **Complete setup guide (start here!)**
- `ARCHITECTURE.md` - Architecture overview
- `CLOUD_RUN_QUICK_START.md` - Quick reference
- `DEPLOY_TO_CLOUD_RUN.md` - Detailed deployment steps
- `SUPABASE_SETUP.md` - Database setup details
- `GITHUB_LINKING_GUIDE.md` - CI/CD setup (optional)

## API Endpoints

- `GET /health` - Health check
- `GET /api/beaches` - Get all beaches (optional query: `?regionId=xxx`)
- `GET /api/beaches/:name` - Get beach by name

More endpoints to be added...

## Database Setup

### Local Development (Docker)

The project uses **Docker Postgres** for local development to match production exactly:

- **Same PostgreSQL version** as production
- **Same migrations** run in both environments
- **No "works on my machine" issues**

**Local Database Connection:**

```
postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev
```

**Docker Container:**

- Image: `postgres:16-alpine`
- Port: `5432`
- Database: `tide_raider_dev`
- User: `tide_raider`
- Password: `tide_raider_dev`

### Production Databases

**Option 1: Supabase (Recommended for Cloud Run)**
- Free tier: 500 MB storage
- Easy setup: Get connection string from Supabase dashboard
- See `SUPABASE_SETUP.md` for details

**Option 2: Fly Postgres (For Fly.io deployment)**
- Attach to Fly.io app: `fly postgres attach tide-raider-db --app tide-raider-backend`
- `DATABASE_URL` is automatically set by Fly.io

**Option 3: Other PostgreSQL providers**
- Any PostgreSQL-compatible database works
- Just set `DATABASE_URL` environment variable

## Environment Variables

**Required:**

- `DATABASE_URL` - PostgreSQL connection string
  - Local: `postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev`
  - Production: Set automatically by Fly Postgres
- `NEXTAUTH_SECRET` - Secret for JWT token verification
- `FRONTEND_URL` - Frontend URL for CORS
- `CRON_SECRET` - Secret for cron job authentication

**Optional:**

- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `RESEND_API_KEY` - For email notifications
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For OAuth

See the `.env` file template in the setup instructions above.
