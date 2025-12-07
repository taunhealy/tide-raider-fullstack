# How to Check Cron Job Execution & Logs in Cloud Run

## Quick Commands

### 1. View Recent Cron Job Logs (Filtered)

**Bash/Linux/Mac:**

```bash
# View last 50 cron-related log entries
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"cron\"" --limit=50 --format=json

# View last 20 cron logs with readable format
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"cron\"" --limit=20 --format="table(timestamp,textPayload)"
```

**PowerShell (Windows):**

```powershell
# View last 50 cron-related log entries (use single quotes)
gcloud logging read 'resource.type=cloud_run_revision AND textPayload=~"cron"' --limit=50 --format=json

# View last 20 cron logs with readable format
gcloud logging read 'resource.type=cloud_run_revision AND textPayload=~"cron"' --limit=20 --format="table(timestamp,textPayload)"
```

### 2. View Cron Job Execution Logs (More Specific)

**Bash/Linux/Mac:**

```bash
# Filter for cron job start messages
gcloud logging read "resource.type=cloud_run_revision AND (textPayload=~\"Starting scheduled cron job\" OR textPayload=~\"Cron job scheduled\" OR textPayload=~\"fetch-and-alert\")" --limit=30

# Filter for cron job completion/errors
gcloud logging read "resource.type=cloud_run_revision AND (textPayload=~\"Cron job completed\" OR textPayload=~\"Cron job failed\")" --limit=30
```

**PowerShell (Windows):**

```powershell
# Filter for cron job start messages
gcloud logging read 'resource.type=cloud_run_revision AND (textPayload=~"Starting scheduled cron job" OR textPayload=~"Cron job scheduled" OR textPayload=~"fetch-and-alert")' --limit=30

# Filter for cron job completion/errors
gcloud logging read 'resource.type=cloud_run_revision AND (textPayload=~"Cron job completed" OR textPayload=~"Cron job failed")' --limit=30

# View all logs from cron route endpoint
gcloud logging read 'resource.type=cloud_run_revision AND httpRequest.requestUrl=~"/api/cron"' --limit=50
```

### 3. Check Cloud Scheduler Job Execution History

```bash
# List all scheduler jobs
gcloud scheduler jobs list --location=europe-west1

# Describe a specific job (shows last execution time)
gcloud scheduler jobs describe tide-raider-cron-4hourly --location=europe-west1

# View scheduler job execution history (last 10 runs)
gcloud logging read "resource.type=cloud_scheduler_job AND resource.labels.job_id=tide-raider-cron-4hourly" --limit=10
```

### 4. View All Recent Cloud Run Logs (Unfiltered)

**Bash/Linux/Mac:**

```bash
# Last 100 log entries from Cloud Run
gcloud logging read "resource.type=cloud_run_revision" --limit=100 --format="table(timestamp,textPayload)"

# Last 50 entries with JSON format (for detailed inspection)
gcloud logging read "resource.type=cloud_run_revision" --limit=50 --format=json
```

**PowerShell (Windows):**

```powershell
# Last 100 log entries from Cloud Run
gcloud logging read 'resource.type=cloud_run_revision' --limit=100 --format="table(timestamp,textPayload)"

# Last 50 entries with JSON format (for detailed inspection)
gcloud logging read 'resource.type=cloud_run_revision' --limit=50 --format=json
```

## PowerShell Commands (Windows) - WORKING VERSIONS

```powershell
# ✅ SIMPLEST: Use "contains" operator (no regex needed)
gcloud logging read "resource.type=cloud_run_revision AND textPayload:cron" --limit=50

# ✅ View cron job execution (contains operator)
gcloud logging read "resource.type=cloud_run_revision AND textPayload:`"Starting scheduled cron job`"" --limit=20

# ✅ View cron completion/errors
gcloud logging read "resource.type=cloud_run_revision AND (textPayload:`"Cron job completed`" OR textPayload:`"Cron job failed`")" --limit=20

# ✅ Alternative: Use regex with backticks to escape quotes
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~`"cron`"" --limit=50
```

**Note:** In PowerShell, use backticks (`) to escape double quotes inside a double-quoted string. The `:` operator (contains) is simpler than regex for text matching.

## What to Look For

### ✅ Successful Cron Execution

Look for these log messages:

- `🕐 Starting scheduled cron job...`
- `✅ Cron job completed in Xms`
- `Regions processed: X`
- `Scores calculated: X`

### ❌ Failed Cron Execution

Look for these log messages:

- `❌ Cron job failed`
- `Error running scheduled cron job`
- `Failed to fetch region data`
- HTTP 500 errors on `/api/cron/*`

## Check via Cloud Console (Web UI)

1. **Go to Cloud Run Logs:**
   - Navigate to: https://console.cloud.google.com/run
   - Select your service: `tide-raider-backend`
   - Click "Logs" tab

2. **Filter Logs:**
   - In the search box, enter: `cron` or `Starting scheduled cron job`
   - Use time range selector to filter by date/time

3. **Check Cloud Scheduler:**
   - Navigate to: https://console.cloud.google.com/cloudscheduler
   - Click on your job: `tide-raider-cron-4hourly`
   - View "Execution history" tab to see last runs

## Verify Cron Job Ran Successfully

### Check Database for New Scores

```bash
# Run this script to check if scores were created today
cd backend
npx tsx scripts/check-scores-by-date.ts
```

Should show:

- ✅ Scores for today's date
- ✅ Scores for tomorrow's date
- ✅ Multiple beaches with scores

### Check Forecast Data

```bash
# Check if forecasts were scraped today
cd backend
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const count = await prisma.forecast.count({
  where: { date: { gte: today } }
});
console.log('Forecasts for today and future:', count);
await prisma.\$disconnect();
"
```

## Common Issues

### Cron Job Not Running

1. **Check if Cloud Scheduler is enabled:**

   ```bash
   gcloud scheduler jobs list --location=europe-west1
   ```

2. **Check if job is paused:**

   ```bash
   gcloud scheduler jobs describe tide-raider-cron-4hourly --location=europe-west1
   ```

   Look for `state: ENABLED` (not `PAUSED`)

3. **Manually trigger to test:**
   ```bash
   gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1
   ```

### Cron Job Failing

1. **Check error logs:**

   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=20
   ```

2. **Check CRON_SECRET:**
   - Verify it matches in Cloud Run and Cloud Scheduler
   - Check: `gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(spec.template.spec.containers[0].env[?name=='CRON_SECRET'].value)"`

3. **Check Cloud Run timeout:**
   - Cron jobs might timeout if they take too long
   - Increase timeout: `gcloud run services update tide-raider-backend --timeout=900 --region=europe-west1`

## Example: View Last Cron Execution

```bash
# Get the most recent cron execution logs
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"Starting scheduled cron job\"" --limit=1 --format=json | jq '.[0] | {timestamp, textPayload}'

# Then get all logs from that execution (by timestamp)
# Use the timestamp from above and filter logs around that time
```

## Real-Time Monitoring

To watch logs in real-time:

**Bash/Linux/Mac:**

```bash
# Stream logs (filtered for cron)
gcloud logging tail "resource.type=cloud_run_revision AND textPayload=~\"cron\"" --format="table(timestamp,textPayload)"
```

**PowerShell (Windows):**

```powershell
# Stream logs (filtered for cron)
gcloud logging tail 'resource.type=cloud_run_revision AND textPayload=~"cron"' --format="table(timestamp,textPayload)"
```
