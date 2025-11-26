# Cloud Scheduler - Quick Command Reference

## Setup (One-Time)
```powershell
cd backend
.\setup-cloud-scheduler.ps1
```

## Daily Operations

### Trigger Cron Manually
```powershell
gcloud scheduler jobs run tide-raider-cron-4hourly --location=europe-west1
```

### Check Last Run Status
```powershell
gcloud scheduler jobs describe tide-raider-cron-4hourly --location=europe-west1
```

### View All Jobs
```powershell
gcloud scheduler jobs list --location=europe-west1
```

### Pause Automatic Runs
```powershell
gcloud scheduler jobs pause tide-raider-cron-4hourly --location=europe-west1
```

### Resume Automatic Runs
```powershell
gcloud scheduler jobs resume tide-raider-cron-4hourly --location=europe-west1
```

## Monitoring

### View Cloud Run Logs (Cron Execution)
```powershell
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~\"cron\"" --limit=20
```

### Check Database for Today's Scores
```powershell
cd backend
npx tsx quick-check.ts
```

## Troubleshooting

### Update Schedule (e.g., every 6 hours instead of 4)
```powershell
gcloud scheduler jobs update http tide-raider-cron-4hourly `
  --schedule="0 */6 * * *" `
  --location=europe-west1
```

### Increase Timeout
```powershell
gcloud scheduler jobs update http tide-raider-cron-4hourly `
  --attempt-deadline=900s `
  --location=europe-west1
```

### Delete Job
```powershell
gcloud scheduler jobs delete tide-raider-cron-4hourly --location=europe-west1
```

## Current Schedule
- **Frequency**: Every 4 hours
- **Times (UTC)**: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
- **Your Time (UTC+2)**: 02:00, 06:00, 10:00, 14:00, 18:00, 22:00

## Cost
- **Cloud Scheduler**: $0.10/month
- **Cloud Run (cron only)**: ~$0.50/month
- **Total**: ~$0.60/month for cron jobs
- **Savings**: 97% vs running 24/7!
