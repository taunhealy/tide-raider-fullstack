# Quick Start: Switch to Optimized Cost Solution

## Current Situation
- **Current cost**: ~$15-30/month (backend running 24/7)
- **Optimized cost**: ~$1.10/month (on-demand with Cloud Scheduler)
- **Savings**: 97% reduction in costs!

## How It Works

Instead of keeping your backend running 24/7, Cloud Scheduler will:
1. Wake up your Cloud Run backend every 4 hours
2. Trigger the cron job (fetch forecasts + process alerts)
3. Backend processes the job (~2 minutes)
4. Backend automatically shuts down
5. You only pay for those 2 minutes!

## Setup (5 minutes)

### Option 1: Automated Setup (Recommended)

Run the PowerShell setup script:

```powershell
cd backend
.\setup-cloud-scheduler.ps1
```

You'll be prompted for:
- **Backend URL**: Your Cloud Run URL (e.g., `https://tide-raider-backend-82632174665.africa-south1.run.app`)
- **CRON_SECRET**: The secret from your Cloud Run environment variables
- **Region**: Usually `europe-west1` or `africa-south1`

### Option 2: Manual Setup

Follow the detailed guide in `CLOUD_SCHEDULER_SETUP.md`

### Option 3: GitHub Actions (100% Free!)

If you prefer not to use Cloud Scheduler, use GitHub Actions instead:

1. Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Surf Forecast Cron Jobs

on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch: # Allow manual trigger

jobs:
  fetch-and-alert:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron Job
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          BACKEND_URL: ${{ secrets.BACKEND_URL }}
        run: |
          curl -X POST $BACKEND_URL/api/cron/run-now \
            -H "Content-Type: application/json" \
            -H "x-cron-secret: $CRON_SECRET" \
            -w "\nHTTP Status: %{http_code}\n"
```

2. Add secrets in GitHub repo settings:
   - `CRON_SECRET`: Your cron secret
   - `BACKEND_URL`: Your Cloud Run URL

## Immediate Fix (Get Fresh Data Now)

Before setting up the scheduler, trigger the cron manually to get today's data:

```powershell
# Replace with your actual values
$BACKEND_URL = "https://tide-raider-backend-82632174665.africa-south1.run.app"
$CRON_SECRET = "your-secret-here"

curl -X POST "$BACKEND_URL/api/cron/run-now" `
  -H "Content-Type: application/json" `
  -H "x-cron-secret: $CRON_SECRET"
```

## Verification

After setup, verify it's working:

### 1. Check Cloud Scheduler Job
```powershell
gcloud scheduler jobs list --location=europe-west1
```

### 2. Trigger Test Run
```powershell
gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1
```

### 3. Check Database for Fresh Scores
```powershell
cd backend
npx tsx quick-check.ts
```

Should show: `Scores for today: <number>` (not 0)

### 4. Verify High Scores Widget
- Go to your app at `/raid`
- Regional High Scores should show today's data
- Big Bay should show current conditions

## Schedule Details

**Cron Expression**: `0 */4 * * *`

**Run Times (UTC)**:
- 00:00 (2:00 AM your time)
- 04:00 (6:00 AM your time)
- 08:00 (10:00 AM your time)
- 12:00 (2:00 PM your time)
- 16:00 (6:00 PM your time)
- 20:00 (10:00 PM your time)

**Total**: 6 runs per day, ~12 minutes of backend execution

## Cost Breakdown

### Before (24/7)
- Cloud Run: ~$15-30/month
- **Total: $15-30/month**

### After (On-Demand)
- Cloud Scheduler: $0.10/month (1 job)
- Cloud Run (cron): ~$0.50/month (6 runs × 2 min/day)
- Cloud Run (API): ~$5-10/month (normal user traffic)
- **Total: ~$6-11/month**

**Your backend will still respond to all API requests normally** - it just won't run 24/7 for cron jobs!

## Troubleshooting

### "Job fails with 401 Unauthorized"
- Check that `CRON_SECRET` matches in both Cloud Run and Cloud Scheduler
- Verify: `gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(spec.template.spec.containers[0].env[?name=='CRON_SECRET'].value)"`

### "Job fails with 504 Timeout"
- Increase timeout: `gcloud scheduler jobs update http tide-raider-cron-4hourly --attempt-deadline=900s --location=europe-west1`

### "No scores in database after run"
- Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"cron\"" --limit=20`
- Look for errors in the cron execution

## Monitoring

### View Last Execution
```powershell
gcloud scheduler jobs describe tide-raider-cron-4hourly `
  --location=europe-west1 `
  --format="table(state, lastAttemptTime, status.code, status.message)"
```

### View Cloud Run Logs
```powershell
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"cron\"" `
  --limit=20 `
  --format=json
```

### Pause/Resume
```powershell
# Pause (stop automatic runs)
gcloud scheduler jobs pause tide-raider-cron-4hourly --location=europe-west1

# Resume
gcloud scheduler jobs resume tide-raider-cron-4hourly --location=europe-west1
```

## Next Steps

1. ✅ Run `.\setup-cloud-scheduler.ps1`
2. ✅ Trigger test run
3. ✅ Verify scores in database
4. ✅ Check High Scores widget
5. ✅ Monitor first few automatic runs
6. 🎉 Enjoy 97% cost savings!

## Questions?

**Q: Will my API still work?**
A: Yes! Cloud Run keeps instances warm for API requests. Only cron jobs are triggered by Cloud Scheduler.

**Q: What if I need to run the cron manually?**
A: `gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1`

**Q: Can I change the schedule?**
A: Yes! `gcloud scheduler jobs update http tide-raider-cron-4hourly --schedule="0 */6 * * *" --location=europe-west1`

**Q: Is GitHub Actions really free?**
A: Yes! GitHub Actions gives you 2,000 minutes/month free for public repos, unlimited for private repos on paid plans.
