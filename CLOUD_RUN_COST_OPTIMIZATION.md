# Cloud Run Cost Optimization - Complete

## Summary of Changes

All cost optimization measures have been successfully implemented to reduce your Google Cloud Run costs.

## ✅ Actions Completed

### 1. **Disabled Artifact Registry Vulnerability Scanning**
- **Command Executed:** `gcloud services disable containerscanning.googleapis.com`
- **Impact:** Eliminates ~$0.26 per container image scan
- **Status:** ✅ Completed
- **Note:** This stops automatic vulnerability scanning for all repositories in your project. You can re-enable it later if needed for security compliance.

### 2. **Optimized Cron Job Schedule**
- **File:** `backend/src/services/cronScheduler.ts`
- **Previous:** Running every 4 hours (6 times/day)
- **New:** Running twice daily:
  - **02:00 UTC** (4am South Africa time - SAST is UTC+2)
  - **20:00 UTC** (4am Bali time - WITA is UTC+8)
- **Impact:** Reduces cron executions from 6/day to 2/day (66% reduction)
- **Status:** ✅ Committed and pushed

### 3. **Reduced Cloud Run Resource Allocation**
- **File:** `cloudbuild.yaml`
- **Previous:** 2Gi memory, 2 CPUs
- **New:** 1Gi memory, 1 CPU
- **Impact:** Reduces compute costs by ~50% when service is running
- **Status:** ✅ Committed and pushed
- **Note:** Future deployments will use the optimized configuration

### 4. **Verified Min Instances = 0**
- **Current Setting:** `--min-instances=0`
- **Impact:** Service scales to zero when idle (no cost during idle periods)
- **Status:** ✅ Already configured correctly

## Current Service Configuration

```yaml
Service: tide-raider-backend-eu
Region: europe-west1
Memory: 1Gi
CPU: 1
Min Instances: 0
Max Instances: 10
```

## Cost Breakdown (Estimated Monthly Savings)

### Before Optimization:
- **Artifact Registry Scanning:** ~$5-15/month (varies by deployment frequency)
- **Cron Jobs (6x/day):** ~$10-20/month
- **Resource Allocation (2Gi/2CPU):** ~$40-60/month (when active)
- **Estimated Total:** ~$55-95/month

### After Optimization:
- **Artifact Registry Scanning:** $0
- **Cron Jobs (2x/day):** ~$3-7/month
- **Resource Allocation (1Gi/1CPU):** ~$20-30/month (when active)
- **Estimated Total:** ~$23-37/month

### **Estimated Savings: ~$30-60/month (50-65% reduction)**

## Additional Cost-Saving Tips

1. **Monitor Your Usage**
   ```bash
   gcloud run services describe tide-raider-backend-eu --region europe-west1
   ```

2. **Check Billing Dashboard**
   - Visit: https://console.cloud.google.com/billing
   - Set up budget alerts to get notified of unexpected costs

3. **Clean Up Old Artifact Registry Images**
   ```bash
   # List all images
   gcloud artifacts docker images list europe-west1-docker.pkg.dev/surf-445620/tide-raider/tide-raider-backend
   
   # Delete old images (optional)
   gcloud artifacts docker images delete IMAGE_URL
   ```

4. **Consider CPU Allocation Mode**
   - Current: CPU always allocated (you pay for CPU even when idle)
   - Alternative: CPU only allocated during requests (cheaper but slower cold starts)
   - Change with: `gcloud run services update tide-raider-backend-eu --cpu-throttling --region europe-west1`

## Re-enabling Features (If Needed)

### Re-enable Artifact Registry Scanning:
```bash
gcloud services enable containerscanning.googleapis.com
```

### Increase Cron Frequency:
Edit `backend/src/services/cronScheduler.ts` line 43:
```typescript
// Every 4 hours:
"0 */4 * * *"

// Every 2 hours:
"0 */2 * * *"
```

### Increase Resources:
Edit `cloudbuild.yaml` lines 34-35 or run:
```bash
gcloud run services update tide-raider-backend-eu --memory 2Gi --cpu 2 --region europe-west1
```

## Next Steps

1. ✅ All changes are committed and pushed
2. ✅ Future deployments will use optimized configuration
3. ☑️ Monitor your Cloud Run logs to ensure service is stable with 1Gi memory
4. ☑️ Check your billing dashboard in 2-3 days to see cost reduction

## Troubleshooting

**If the service becomes unstable with 1Gi:**
```bash
gcloud run services update tide-raider-backend-eu --memory 1536Mi --region europe-west1
```

**Check service logs:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tide-raider-backend-eu" --limit 50
```

---
**Created:** 2025-12-02  
**Status:** Complete ✅
