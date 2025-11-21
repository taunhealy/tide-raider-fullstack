# Database Connection Troubleshooting

If you're getting 404 errors or database connection issues, follow these steps:

## Step 1: Check if Docker Postgres is Running

```powershell
# Check if Docker container is running
docker ps

# Look for a container named something like "tide-raider-fullstack-postgres-1" or "postgres"
```

If no postgres container is running:

```powershell
cd backend
npm run db:start
```

Wait a few seconds for the database to be ready.

## Step 2: Verify Database Connection

Test if the backend can connect to the database:

```powershell
cd backend
npm run prisma:studio
```

If Prisma Studio opens, the database connection is working.

## Step 3: Check Backend Environment Variables

Make sure `backend/.env` has:

```env
DATABASE_URL="postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev?schema=public"
```

## Step 4: Check if Backend is Running

```powershell
# Test backend health endpoint
curl http://localhost:4001/health

# Should return: {"status":"ok","timestamp":"..."}
```

If this fails, the backend isn't running. Start it:

```powershell
cd backend
npm run dev
```

## Step 5: Test Regions Endpoint Directly

```powershell
# Test if regions endpoint exists
curl http://localhost:4001/api/regions

# Should return an array of regions or empty array []
```

If you get 404:
- Backend route might not be registered
- Check `backend/src/routes/index.ts` - should have `router.use("/regions", regionsRouter);`

## Step 6: Check Backend Logs

Look at the backend terminal for errors:
- Database connection errors
- Route registration errors
- Prisma client errors

Common errors:
- `Can't reach database server` - Docker Postgres not running
- `P1001` - Database connection failed
- `PrismaClientInitializationError` - Prisma client not generated

## Step 7: Regenerate Prisma Client

If database schema changed:

```powershell
cd backend
npm run prisma:generate
npm run dev
```

## Step 8: Run Migrations

If database is empty or schema is outdated:

```powershell
cd backend
npm run prisma:migrate
```

## Quick Fix Checklist

- [ ] Docker Desktop is running
- [ ] Postgres container is running (`docker ps`)
- [ ] Backend server is running on port 4001
- [ ] `backend/.env` has correct `DATABASE_URL`
- [ ] Prisma client is generated (`npm run prisma:generate`)
- [ ] Migrations are applied (`npm run prisma:migrate`)
- [ ] Backend health endpoint works (`curl http://localhost:4001/health`)
- [ ] Regions endpoint exists (`curl http://localhost:4001/api/regions`)

