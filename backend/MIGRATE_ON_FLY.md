# Running Prisma Migrations on Fly.io

Since the database is only accessible from Fly.io's network, migrations must be run on Fly.io.

## Quick Migration Command

### Option 1: Using npm script (Recommended)
```powershell
cd backend
npm run fly:migrate
```

### Option 2: Using PowerShell script
```powershell
cd backend
.\run-migration-fly.ps1
```

### Option 3: Direct flyctl command
```powershell
fly ssh console -C "cd /app && npx prisma migrate deploy" --app tide-raider-backend
```

## Step-by-Step Process

1. **Make sure you're logged into Fly.io:**
   ```powershell
   fly auth login
   ```

2. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

3. **Run the migration:**
   ```powershell
   npm run fly:migrate
   ```

   This will:
   - SSH into the Fly.io machine
   - Navigate to `/app`
   - Run `npx prisma migrate deploy`
   - Apply all pending migrations

4. **Verify the migration:**
   ```powershell
   fly ssh console -C "cd /app && npx prisma migrate status" --app tide-raider-backend
   ```

## What This Does

- Connects to your Fly.io app via SSH
- Runs `prisma migrate deploy` which applies all pending migrations
- Uses the production `DATABASE_URL` from Fly.io secrets
- Does NOT create a new migration (use `prisma migrate dev` locally for that)

## Important Notes

- ⚠️ **Always test migrations locally first** (if possible with a test database)
- ⚠️ **Backup your database** before running migrations in production
- ✅ `migrate deploy` is safe for production - it only applies pending migrations
- ✅ It won't create new migration files, only apply existing ones

## Troubleshooting

### Error: "Can't reach database server"
- Make sure `DATABASE_URL` is set in Fly.io secrets
- Verify the database is accessible from Fly.io network

### Error: "Migration already applied"
- This is normal if the migration was already run
- Check migration status: `fly ssh console -C "cd /app && npx prisma migrate status"`

### Error: "No pending migrations"
- All migrations are up to date
- If you created a new migration locally, make sure it's committed and deployed

## Creating New Migrations

To create a new migration (like adding ForecastB):

1. **Create migration locally** (with a local/test database):
   ```powershell
   cd backend
   npx prisma migrate dev --name add_forecast_b
   ```

2. **Commit the migration files** to git:
   ```powershell
   git add prisma/migrations
   git commit -m "Add ForecastB model migration"
   git push
   ```

3. **Deploy to Fly.io:**
   ```powershell
   fly deploy --app tide-raider-backend
   ```

4. **Run the migration on Fly.io:**
   ```powershell
   npm run fly:migrate
   ```


