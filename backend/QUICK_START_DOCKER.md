# Quick Start: Docker Postgres Setup

## Step 1: Start Docker Desktop

**Make sure Docker Desktop is running!** 

- Open Docker Desktop application
- Wait for it to fully start (whale icon in system tray)

## Step 2: Update Your .env File

Run this PowerShell script to automatically update your DATABASE_URL:

```powershell
cd backend
.\update-env-for-docker.ps1
```

**OR manually edit `backend/.env`:**

Change this line:
```env
DATABASE_URL="postgresql://fly-user:CgTmIxiwjbinc22DO8GYUAV5@pgbouncer.vmkq6098l4pr35ln.flympg.net/fly-db"
```

To this:
```env
DATABASE_URL="postgresql://tide_raider:tide_raider_dev@localhost:5432/tide_raider_dev?schema=public"
```

## Step 3: Start Docker Postgres

```powershell
npm run db:start
```

Wait a few seconds for the database to be ready.

## Step 4: Run Migrations

```powershell
npm run prisma:migrate
```

## Step 5: (Optional) Seed Database

```powershell
npm run db:seed
```

## Step 6: Start Dev Server

```powershell
npm run dev
```

## Troubleshooting

### "Docker Desktop is not running"
- Open Docker Desktop
- Wait for it to fully start
- Try again

### "Port 5432 already in use"
- Another PostgreSQL instance might be running
- Check: `netstat -ano | findstr :5432`
- Stop the other service or change the port in `docker-compose.yml`

### "Can't reach database server"
- Make sure Docker container is running: `docker ps`
- Check logs: `npm run db:logs`
- Restart: `npm run db:restart`

