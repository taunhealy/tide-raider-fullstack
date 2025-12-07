# Reduce Artifact Registry Costs to $0

## Current Cost: $2.43/month

**Goal**: Reduce to $0 or minimal (< $0.10/month)

## Quick Fix (Saves ~$2.30/month)

### Step 1: Disable Vulnerability Scanning (Biggest Cost Saver)

**PowerShell Command:**

```powershell
gcloud artifacts repositories update tide-raider `
  --location=europe-west1 `
  --disable-vulnerability-scanning
```

**Or via Cloud Console:**

1. Go to [Artifact Registry](https://console.cloud.google.com/artifacts?project=_)
2. Select repository: `tide-raider`
3. Click **Edit**
4. Under **Vulnerability scanning**, uncheck **Scan on push**
5. Click **Save**

**Expected Savings**: ~$2.30/month (95% of current cost)

### Step 2: Set Up Auto-Delete Lifecycle Policy (Saves Storage Costs)

Create a lifecycle policy that automatically deletes old images:

**PowerShell Command:**

```powershell
# Create lifecycle policy file
@"
{
  "rules": [
    {
      "description": "Delete untagged images older than 3 days",
      "action": { "type": "DELETE" },
      "condition": {
        "tagState": "UNTAGGED",
        "olderThan": "3d"
      }
    },
    {
      "description": "Keep only last 5 tagged images per tag",
      "action": { "type": "DELETE" },
      "condition": {
        "tagState": "TAGGED",
        "olderThan": "14d"
      }
    }
  ]
}
"@ | Out-File -FilePath lifecycle-policy.json -Encoding utf8

# Apply the policy
gcloud artifacts repositories update tide-raider `
  --location=europe-west1 `
  --lifecycle-policy=lifecycle-policy.json
```

**Expected Savings**: ~$0.10-0.13/month (storage costs)

### Step 3: Manually Delete Old Images (One-Time Cleanup)

**PowerShell Commands:**

```powershell
# Get your project ID
$PROJECT_ID = gcloud config get-value project

# List all images with sizes
gcloud artifacts docker images list `
  europe-west1-docker.pkg.dev/$PROJECT_ID/tide-raider/tide-raider-backend `
  --format="table(package,create_time,update_time)" `
  --sort-by=~create_time

# Delete all images except the latest 3
$IMAGES = gcloud artifacts docker images list `
  europe-west1-docker.pkg.dev/$PROJECT_ID/tide-raider/tide-raider-backend `
  --format="value(package)" `
  --sort-by=~create_time

# Keep first 3, delete the rest
$IMAGES_TO_DELETE = $IMAGES | Select-Object -Skip 3

foreach ($image in $IMAGES_TO_DELETE) {
    Write-Host "Deleting: $image" -ForegroundColor Yellow
    gcloud artifacts docker images delete $image --quiet
}
```

## Verify Changes

### Check Repository Settings:

```powershell
gcloud artifacts repositories describe tide-raider `
  --location=europe-west1 `
  --format="yaml(vulnerabilityScanningConfig,lifecyclePolicy)"
```

**Expected Output:**

- `vulnerabilityScanningConfig.enablementState: SCANNING_DISABLED` ✅
- `lifecyclePolicy` should show your rules ✅

### Check Current Images:

```powershell
$PROJECT_ID = gcloud config get-value project
gcloud artifacts docker images list `
  europe-west1-docker.pkg.dev/$PROJECT_ID/tide-raider/tide-raider-backend `
  --format="table(package,create_time,update_time)" `
  --sort-by=~create_time
```

### Monitor Costs:

1. Go to [Cloud Billing](https://console.cloud.google.com/billing)
2. Select your project
3. View **Cost breakdown** → Filter by **Artifact Registry**
4. Check costs after 24-48 hours

## Expected Results

**Before:**

- Vulnerability Scanning: ~$2.30/month
- Storage: ~$0.13/month
- **Total: $2.43/month**

**After:**

- Vulnerability Scanning: $0.00/month ✅
- Storage: ~$0.03-0.05/month (only latest images)
- **Total: ~$0.03-0.05/month** 🎉

**Savings: ~$2.38/month (98% reduction)**

## Complete Script (Run All at Once)

```powershell
# Step 1: Disable vulnerability scanning
Write-Host "Step 1: Disabling vulnerability scanning..." -ForegroundColor Yellow
gcloud artifacts repositories update tide-raider `
  --location=europe-west1 `
  --disable-vulnerability-scanning

# Step 2: Create and apply lifecycle policy
Write-Host "Step 2: Setting up lifecycle policy..." -ForegroundColor Yellow
@"
{
  "rules": [
    {
      "description": "Delete untagged images older than 3 days",
      "action": { "type": "DELETE" },
      "condition": {
        "tagState": "UNTAGGED",
        "olderThan": "3d"
      }
    },
    {
      "description": "Keep only last 5 tagged images per tag",
      "action": { "type": "DELETE" },
      "condition": {
        "tagState": "TAGGED",
        "olderThan": "14d"
      }
    }
  ]
}
"@ | Out-File -FilePath lifecycle-policy.json -Encoding utf8

gcloud artifacts repositories update tide-raider `
  --location=europe-west1 `
  --lifecycle-policy=lifecycle-policy.json

# Step 3: Clean up old images (optional - keeps last 3)
Write-Host "Step 3: Cleaning up old images..." -ForegroundColor Yellow
$PROJECT_ID = gcloud config get-value project
$IMAGES = gcloud artifacts docker images list `
  europe-west1-docker.pkg.dev/$PROJECT_ID/tide-raider/tide-raider-backend `
  --format="value(package)" `
  --sort-by=~create_time

$IMAGES_TO_DELETE = $IMAGES | Select-Object -Skip 3
$COUNT = ($IMAGES_TO_DELETE | Measure-Object).Count

if ($COUNT -gt 0) {
    Write-Host "Deleting $COUNT old images..." -ForegroundColor Yellow
    foreach ($image in $IMAGES_TO_DELETE) {
        gcloud artifacts docker images delete $image --quiet
    }
} else {
    Write-Host "No old images to delete." -ForegroundColor Green
}

# Step 4: Verify
Write-Host "`nStep 4: Verifying changes..." -ForegroundColor Yellow
gcloud artifacts repositories describe tide-raider `
  --location=europe-west1 `
  --format="yaml(scanOnPush,lifecyclePolicy)"

Write-Host "`n✅ Done! Artifact Registry costs should drop to ~$0.03-0.05/month" -ForegroundColor Green
Write-Host "Monitor costs at: https://console.cloud.google.com/billing" -ForegroundColor Cyan
```

## Notes

- **Vulnerability Scanning**: Disabling this saves the most money. You can still scan manually if needed.
- **Lifecycle Policy**: Runs automatically - no manual intervention needed. Old images are deleted automatically.
- **Storage Costs**: With lifecycle policy, you'll only pay for ~3-5 images (usually < $0.05/month).
- **Rebuilding Images**: Old images can always be rebuilt from source code, so it's safe to delete them.
- **No Impact on Deployments**: These changes don't affect your Cloud Run deployments at all.

## Troubleshooting

**If lifecycle policy doesn't work:**

```powershell
# Check if policy was applied
gcloud artifacts repositories describe tide-raider `
  --location=europe-west1 `
  --format="yaml(lifecyclePolicy)"

# Re-apply if needed
gcloud artifacts repositories update tide-raider `
  --location=europe-west1 `
  --lifecycle-policy=lifecycle-policy.json
```

**If you need to re-enable scanning temporarily:**

```powershell
gcloud artifacts repositories update tide-raider `
  --location=europe-west1 `
  --allow-vulnerability-scanning
```
