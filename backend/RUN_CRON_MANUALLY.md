# Run Cron Job Manually

## Problem
The High Scores widget is showing old data from November 23rd because the cron job hasn't run today (November 26th).

## Solution
Manually trigger the cron job to fetch today's forecast data and calculate beach scores.

## Steps

### Option 1: Use the trigger script (Recommended)
```powershell
cd backend
$env:CRON_SECRET='your-secret-from-.env'
npx tsx trigger-cron.ts
```

### Option 2: Call the API directly
```powershell
# Set your CRON_SECRET from backend/.env
$CRON_SECRET = "your-secret-here"
$BACKEND_URL = "http://localhost:4001"  # or your deployed backend URL

# Trigger the cron job
curl -X POST "$BACKEND_URL/api/cron/run-now" `
  -H "Content-Type: application/json" `
  -H "x-cron-secret: $CRON_SECRET"
```

### Option 3: Start the cron scheduler
If your backend is running locally, the cron scheduler should be running automatically.
Check your backend logs for:
- `🕐 Starting cron scheduler...`
- `✅ Cron job scheduled: Every 4 hours...`

## Expected Result
After running the cron job, you should see:
1. Forecast data fetched for all regions
2. Beach scores calculated and stored in `BeachDailyScore` table
3. High Scores widget showing current data with accurate scores

## Verification
Run this to check if scores were created:
```powershell
npx tsx quick-check.ts
```

Should show: `Scores for today: <number greater than 0>`

## Why This Happened
The cron job runs every 4 hours at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC

Current time: 09:57 your time (07:57 UTC)
Last scheduled run: 04:00 UTC (06:00 AM your time)

The cron job either:
1. Didn't run at 04:00 UTC
2. Failed during execution
3. Isn't enabled in your environment

Check `backend/.env` for:
- `ENABLE_CRON=true` (or not set to false)
- `ENABLE_CRON_IN_DEV=true` (if running in development)
