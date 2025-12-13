# Fix GitHub Actions Cron Job Failure

## Problem

Your GitHub Actions cron job is failing with error:
```
env:
  CRON_SECRET: 
  BACKEND_URL: ***
Error: Process completed with exit code 6.
```

The `CRON_SECRET` is empty/missing from your GitHub repository secrets.

## Solution

### Step 1: Get Your CRON_SECRET from Cloud Run

Run this PowerShell command to get your current CRON_SECRET:

```powershell
gcloud run services describe tide-raider-backend --region=europe-west1 --format="value(spec.template.spec.containers[0].env[?name=='CRON_SECRET'].value)"
```

**Or** if the secret is stored in Google Secret Manager:

```powershell
gcloud secrets versions access latest --secret="CRON_SECRET"
```

This will output your secret value. **Copy it** for the next step.

### Step 2: Add Secrets to GitHub Repository

1. **Go to your GitHub repository**
   - Navigate to: https://github.com/YOUR_USERNAME/tide-raider-fullstack

2. **Open Settings**
   - Click on **Settings** tab

3. **Navigate to Secrets**
   - Click **Secrets and variables** → **Actions**

4. **Add CRON_SECRET**
   - Click **New repository secret**
   - Name: `CRON_SECRET`
   - Value: (paste the value from Step 1)
   - Click **Add secret**

5. **Verify BACKEND_URL** (should already be set)
   - Check if `BACKEND_URL` exists
   - Value should be: `https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app`
   - If missing, add it as a new secret

### Step 3: Test the Workflow

1. **Go to Actions tab** in your GitHub repository
2. **Find "Tide Raider Cron Jobs"** workflow
3. **Click "Run workflow"** → "Run workflow" to manually trigger it
4. **Watch the execution** - it should succeed with a 200 status code

## Expected Success Output

After fixing, you should see:

```
Triggering Cron Job at Fri Dec 12 16:14:58 UTC 2025
Response Body: {"success":true,"timezone":"Africa/Johannesburg","timestamp":"...","duration":"...ms","regionResults":{...},"alertResults":{...}}
Cron job completed successfully
```

## Verification

Once secrets are added, the workflow will:
- ✅ Authenticate with your backend using `X-Cron-Secret` header
- ✅ Fetch surf conditions for all regions
- ✅ Process user alerts
- ✅ Return 200 status code
- ✅ Complete successfully

## Current Schedule

The cron job runs **every 4 hours** at:
- 00:00 UTC (02:00 SAST)
- 04:00 UTC (06:00 SAST)
- 08:00 UTC (10:00 SAST)
- 12:00 UTC (14:00 SAST)
- 16:00 UTC (18:00 SAST)
- 20:00 UTC (22:00 SAST)

## Troubleshooting

### Still getting 401 errors?
- Ensure the `CRON_SECRET` in GitHub matches the one in Cloud Run exactly
- Check for any extra whitespace or quotes in the secret value
- Verify the secret name is exactly `CRON_SECRET` (case-sensitive)

### Still getting exit code 6?
- This usually means the curl command failed before checking the status
- Verify `BACKEND_URL` is set correctly
- Try running the workflow manually with workflow_dispatch

### 500 errors?
- Check your Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision" --limit=50`
- Verify database connection strings are correct
- Check that all environment variables are set in Cloud Run
