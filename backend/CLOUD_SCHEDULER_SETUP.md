# Google Cloud Scheduler Setup for Cron Jobs

## Overview
This setup allows Cloud Scheduler to trigger your Cloud Run backend on-demand every 4 hours, so you don't need to keep the backend running 24/7. Cloud Run will:
- **Spin up** when Cloud Scheduler calls it
- **Execute** the cron job (fetch forecasts + process alerts)
- **Spin down** automatically after completion

This is **cost-efficient** because you only pay for the seconds the backend is actually running.

## Prerequisites
1. Google Cloud Project with Cloud Run backend deployed
2. Cloud Scheduler API enabled
3. `CRON_SECRET` environment variable set in Cloud Run

## Setup Steps

### 1. Enable Cloud Scheduler API
```bash
gcloud services enable cloudscheduler.googleapis.com
```

### 2. Create Service Account (if not exists)
```bash
# Create service account for Cloud Scheduler
gcloud iam service-accounts create cloud-scheduler-invoker \
  --display-name="Cloud Scheduler Invoker"

# Grant permission to invoke Cloud Run
gcloud run services add-iam-policy-binding tide-raider-backend \
  --member="serviceAccount:cloud-scheduler-invoker@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=europe-west1
```

### 3. Get Your Cloud Run URL
```bash
gcloud run services describe tide-raider-backend \
  --region=europe-west1 \
  --format='value(status.url)'
```

Example output: `https://tide-raider-backend-82632174665.africa-south1.run.app`

### 4. Create Cloud Scheduler Jobs

Run every 4 hours at: **00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC**

```bash
# Get your CRON_SECRET from Cloud Run environment
CRON_SECRET="your-secret-here"
BACKEND_URL="https://tide-raider-backend-82632174665.africa-south1.run.app"
PROJECT_ID="your-project-id"

# Create scheduler job for every 4 hours
gcloud scheduler jobs create http tide-raider-cron-4hourly \
  --location=europe-west1 \
  --schedule="0 */4 * * *" \
  --uri="${BACKEND_URL}/api/cron/run-now" \
  --http-method=POST \
  --headers="Content-Type=application/json,x-cron-secret=${CRON_SECRET}" \
  --oidc-service-account-email="cloud-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com" \
  --oidc-token-audience="${BACKEND_URL}" \
  --time-zone="UTC" \
  --attempt-deadline=600s \
  --max-retry-attempts=2 \
  --description="Fetch surf forecasts and process alerts every 4 hours"
```

### 5. Verify Setup
```bash
# List all scheduler jobs
gcloud scheduler jobs list --location=europe-west1

# Test the job manually
gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1

# View logs
gcloud scheduler jobs describe tide-raider-cron-4hourly --location=europe-west1
```

## Schedule Explanation

**Cron expression**: `0 */4 * * *`
- Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
- Frequency: Every 4 hours
- Coverage: 6 runs per day

## Cost Estimate

### Cloud Scheduler
- **Free tier**: 3 jobs per month
- **Paid**: $0.10 per job per month
- **Your cost**: $0.10/month (1 job)

### Cloud Run (triggered 6 times/day)
Assuming each cron run takes ~2 minutes:
- **Execution time**: 6 runs × 2 min = 12 minutes/day = 360 minutes/month
- **Memory**: 512 MB
- **CPU**: 1 vCPU
- **Estimated cost**: ~$0.50-$1.00/month

**Total estimated cost**: ~$1.10/month (vs ~$15-30/month running 24/7)

## Monitoring

### View Cloud Scheduler Logs
```bash
gcloud logging read "resource.type=cloud_scheduler_job AND resource.labels.job_id=tide-raider-cron-4hourly" \
  --limit=10 \
  --format=json
```

### View Cloud Run Logs (Cron Execution)
```bash
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"cron\"" \
  --limit=20 \
  --format=json
```

### Check Last Execution
```bash
gcloud scheduler jobs describe tide-raider-cron-4hourly \
  --location=europe-west1 \
  --format="table(state, lastAttemptTime, status.code)"
```

## Troubleshooting

### Job Fails with 401 Unauthorized
- Check `CRON_SECRET` matches in Cloud Run environment and scheduler job
- Verify service account has `roles/run.invoker` permission

### Job Fails with 504 Timeout
- Increase `--attempt-deadline` (default 180s, max 1800s)
- Check Cloud Run logs for slow operations

### Job Never Runs
- Verify timezone is set to UTC
- Check job is enabled: `gcloud scheduler jobs describe ... --format="value(state)"`
- Enable if paused: `gcloud scheduler jobs resume tide-raider-cron-4hourly --location=europe-west1`

## Manual Trigger (For Testing)

### Using gcloud
```bash
gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1
```

### Using curl (from local machine)
```bash
curl -X POST https://tide-raider-backend-82632174665.africa-south1.run.app/api/cron/run-now \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

## Updating the Schedule

### Change frequency (e.g., every 6 hours)
```bash
gcloud scheduler jobs update http tide-raider-cron-4hourly \
  --location=europe-west1 \
  --schedule="0 */6 * * *"
```

### Pause the job
```bash
gcloud scheduler jobs pause tide-raider-cron-4hourly --location=europe-west1
```

### Resume the job
```bash
gcloud scheduler jobs resume tide-raider-cron-4hourly --location=europe-west1
```

## Next Steps

1. Run the setup commands above
2. Test with manual trigger
3. Monitor first few automatic runs
4. Check database for fresh `BeachDailyScore` records
5. Verify High Scores widget shows current data

## Alternative: GitHub Actions (Free)

If you prefer not to use Cloud Scheduler, you can use GitHub Actions (completely free):

See: `.github/workflows/cron-jobs.yml` (create this file)

```yaml
name: Surf Forecast Cron Jobs

on:
  schedule:
    # Every 4 hours: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
    - cron: '0 */4 * * *'
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

Add secrets in GitHub repo settings:
- `CRON_SECRET`: Your cron secret
- `BACKEND_URL`: Your Cloud Run URL
