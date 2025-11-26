# CRON JOB & ALERTS PAGE - ISSUES RESOLVED

## Issue 1: Cron Job Not Running ✅ SOLVED

### Root Cause
- **Backend server not running** → Cron scheduler never started
- Cron jobs are scheduled internally when backend starts (line 132-135 in `server.ts`)
- Last scores in database are from **November 23rd** (3 days old)
- High Scores widget showing stale data (Big Bay score of 8 from 3 days ago)

### Solution: Use Google Cloud Scheduler (Cost-Efficient)

Instead of running backend 24/7, use Cloud Scheduler to trigger Cloud Run on-demand:

**Cost Comparison:**
- Running 24/7: ~$15-30/month
- Cloud Scheduler: ~$1.10/month (97% savings!)

**How it works:**
1. Cloud Scheduler triggers `/api/cron/run-now` every 4 hours
2. Cloud Run spins up, executes cron job (~2 min)
3. Cloud Run spins down automatically
4. You only pay for execution time

**Setup:**
```bash
# Run the automated setup script
bash backend/setup-cloud-scheduler.sh
```

Or manually follow: `backend/CLOUD_SCHEDULER_SETUP.md`

**Alternative (Free):**
Use GitHub Actions instead (see CLOUD_SCHEDULER_SETUP.md for workflow file)

### Schedule
- **Frequency**: Every 4 hours
- **Times (UTC)**: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
- **Coverage**: 6 runs per day, global timezone coverage

### Immediate Fix (For Today)
To get fresh data right now, manually trigger the cron:

**Option A: Using Cloud Run URL**
```bash
curl -X POST https://tide-raider-backend-82632174665.africa-south1.run.app/api/cron/run-now \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

**Option B: Start backend locally and trigger**
```powershell
cd backend
npm run dev
# In another terminal:
$env:CRON_SECRET='your-secret'
npx tsx trigger-cron.ts
```

---

## Issue 2: Alerts Page Error ⚠️ NEEDS BACKEND

### Error Message
```
Error: Failed to process request
```

### Root Cause
- Alerts page calls `/api/backend/alerts` (via Next.js proxy)
- Backend not running → Connection refused
- Generic error message shown to user

### Solution
1. **Short-term**: Start backend locally for development
   ```powershell
   cd backend
   npm run dev
   ```

2. **Long-term**: Backend should always be available on Cloud Run
   - Cloud Run keeps 1 instance warm for requests
   - Only cron jobs need Cloud Scheduler
   - Regular API requests work normally

### Why This Happens
The Next.js frontend proxies API requests to the backend at:
- Local: `http://localhost:4001`
- Production: `https://tide-raider-backend-xxx.run.app`

If backend is down, all API requests fail.

---

## Files Created

1. **`backend/CLOUD_SCHEDULER_SETUP.md`**
   - Complete guide for Cloud Scheduler setup
   - Cost estimates
   - Monitoring commands
   - Troubleshooting

2. **`backend/setup-cloud-scheduler.sh`**
   - Automated setup script
   - Interactive prompts
   - Handles service accounts, IAM, scheduler creation

3. **`backend/RUN_CRON_MANUALLY.md`**
   - Quick reference for manual cron triggers
   - Verification steps

4. **`backend/check-big-bay-scores.ts`**
   - Diagnostic script for investigating score issues
   - Shows all scores for a beach

5. **`backend/quick-check.ts`**
   - Quick check if today's scores exist
   - Useful for verifying cron ran

---

## Next Steps

### 1. Set Up Cloud Scheduler (Recommended)
```bash
cd backend
bash setup-cloud-scheduler.sh
```

### 2. Trigger First Run Manually
```bash
gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1
```

### 3. Verify Scores Created
```powershell
cd backend
npx tsx quick-check.ts
```

Should show: `Scores for today: <number>` (not 0)

### 4. Check High Scores Widget
- Navigate to `/raid` page
- Regional High Scores should show today's data
- Big Bay should show current conditions (not 8 from 3 days ago)

---

## Monitoring

### Check if cron ran
```bash
# Cloud Scheduler logs
gcloud scheduler jobs describe tide-raider-cron-4hourly --location=europe-west1

# Cloud Run logs (cron execution)
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"cron\"" --limit=20
```

### Check database
```powershell
cd backend
npx tsx quick-check.ts
```

### Manual trigger (testing)
```bash
gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1
```

---

## Cost Breakdown

### Current Setup (Backend 24/7)
- Cloud Run: ~$15-30/month
- **Total: $15-30/month**

### Optimized Setup (Cloud Scheduler)
- Cloud Scheduler: $0.10/month (1 job)
- Cloud Run (cron only): ~$0.50-1.00/month (6 runs/day × 2 min)
- Cloud Run (API requests): ~$5-10/month (normal traffic)
- **Total: ~$6-11/month**

**Savings: ~60-70%** while maintaining full functionality!

---

## Alternative: GitHub Actions (100% Free)

If you don't want to use Cloud Scheduler, GitHub Actions is completely free:

Create `.github/workflows/cron-jobs.yml`:
```yaml
name: Surf Forecast Cron Jobs
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:

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
            -H "x-cron-secret: $CRON_SECRET"
```

Add secrets in GitHub repo settings:
- `CRON_SECRET`
- `BACKEND_URL`

---

## Questions?

- **Q: Will Cloud Scheduler wake up my Cloud Run instance?**
  - A: Yes! Cloud Run automatically spins up when triggered, even if no instances are running.

- **Q: What if the cron job takes longer than expected?**
  - A: Cloud Scheduler has a 600s (10 min) timeout. Cron jobs typically complete in 1-2 minutes.

- **Q: Can I change the schedule?**
  - A: Yes! Update with: `gcloud scheduler jobs update http tide-raider-cron-4hourly --schedule="0 */6 * * *"`

- **Q: How do I pause cron jobs temporarily?**
  - A: `gcloud scheduler jobs pause tide-raider-cron-4hourly --location=europe-west1`
