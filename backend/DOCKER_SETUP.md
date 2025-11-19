# Docker Postgres Setup Guide

## Quick Start

### 1. Start Docker Postgres

```bash
cd backend
npm run db:start
```

This will start a PostgreSQL 16 container on port 5432.

### 2. Update Your `.env.local` File

Replace your current `DATABASE_URL` with the local Docker connection string:

```env
# Local Docker Postgres (for development)
DATABASE_URL="postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev?schema=public"
```

### 3. Run Migrations

```bash
npm run prisma:migrate
```

This will create all tables in your local database.

### 4. (Optional) Seed the Database

```bash
npm run db:seed
```

## Environment Setup

### Development (Local Docker)

```env
DATABASE_URL="postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev?schema=public"
NODE_ENV=development
```

### Production (Fly Postgres)

```env
DATABASE_URL="postgresql://fly-user:YOUR_PASSWORD@pgbouncer.YOUR_HOST.flympg.net/fly-db"
NODE_ENV=production
```

## Useful Commands

```bash
# Database Management
npm run db:start    # Start Docker Postgres
npm run db:stop     # Stop Docker Postgres
npm run db:restart  # Restart Docker Postgres
npm run db:logs     # View database logs
npm run db:reset    # Reset database (⚠️ deletes all data)

# Prisma
npm run prisma:studio  # Open Prisma Studio (GUI)
npm run prisma:migrate # Create and apply migrations
```

## Database Connection Details

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `tide_raider_dev`
- **User**: `tide_raider`
- **Password**: `tide_raider_dev`

## Troubleshooting

### Port Already in Use

If port 5432 is already in use, you can change it in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432" # Use 5433 instead of 5432
```

Then update your `DATABASE_URL` to use port 5433.

### Container Won't Start

```bash
# Check if container is running
docker ps -a

# View logs
npm run db:logs

# Remove and recreate
docker-compose down -v
npm run db:start
```
