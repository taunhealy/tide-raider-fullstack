# Quick PowerShell Commands for Checking Cron Logs
# Copy and paste these commands ONE AT A TIME into PowerShell

# 1. View recent cron logs (SIMPLEST - uses "contains" operator)
gcloud logging read "resource.type=cloud_run_revision AND textPayload:cron" --limit=50

# 2. View cron job execution messages
gcloud logging read "resource.type=cloud_run_revision AND textPayload:`"Starting scheduled cron job`"" --limit=20

# 3. View cron completion/errors
gcloud logging read "resource.type=cloud_run_revision AND (textPayload:`"Cron job completed`" OR textPayload:`"Cron job failed`")" --limit=20

# 4. View all recent Cloud Run logs (unfiltered)
gcloud logging read "resource.type=cloud_run_revision" --limit=100 --format="table(timestamp,textPayload)"

# 5. Check Cloud Scheduler job status
gcloud scheduler jobs describe tide-raider-cron-4hourly --location=europe-west1

# 6. List all scheduler jobs
gcloud scheduler jobs list --location=europe-west1

