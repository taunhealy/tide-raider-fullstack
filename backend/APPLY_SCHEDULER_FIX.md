# Apply Scheduler Fix

The Cloud Scheduler configuration scripts have been updated to run **once daily at 3 AM SAST** (instead of every 4 hours).

## Steps to Apply

1. Open a terminal in the `backend` directory.
2. Run the setup script to apply the new schedule and clean up the old job:
   
   **Windows (PowerShell):**
   ```powershell
   ./setup-cloud-scheduler.ps1
   ```
   
   **Linux/Mac:**
   ```bash
   chmod +x setup-cloud-scheduler.sh
   ./setup-cloud-scheduler.sh
   ```

3. **Verify Clean Up:**
   Run the following command to verify that only the new job exists and there are no duplicate jobs running (especially any that might be hitting `/api/cron/fetch-and-alert` directly):
   ```bash
   gcloud scheduler jobs list --location=europe-west1
   ```
   *(Replace `europe-west1` with your actual region if different, e.g. `africa-south1`)*
   
   You should see `tide-raider-cron-daily-3am`.
   If you see other jobs (e.g., pointing to `/fetch-and-alert` or old 4-hourly jobs that weren't caught), delete them manually:
   ```bash
   gcloud scheduler jobs delete [JOB_NAME] --location=[REGION]
   ```
