# Quick Deploy - Forecast Fallback Fix

## ✅ Automatic Deployment (If Repo is Linked)

If your GitHub repo is already linked to Cloud Build, just **commit and push**:

```bash
git add .
git commit -m "Add forecast fallback logic - returns most recent forecast when exact date not found"
git push origin main
```

Cloud Build will automatically:
- ✅ Build the Docker image
- ✅ Deploy to Cloud Run
- ✅ Update the service

**Monitor:** https://console.cloud.google.com/cloud-build/builds?project=surf-445620

---

## 📝 What's Being Deployed

**File Changed:** `backend/src/routes/forecast.ts`

**New Behavior:**
- ✅ If exact date not found → returns most recent forecast for same source
- ✅ If still not found → returns most recent forecast for any source  
- ✅ Only returns 404 if absolutely no forecast data exists

**Result:** WeatherForecastWidget will show data even when today's date isn't available!

---

## ⚠️ Important Notes

1. **Region Change:** `cloudbuild.yaml` is now set to `europe-west1` (Belgium)
   - If this is your first deployment to europe-west1, the service URL will change
   - You'll need to update `NEXT_PUBLIC_API_URL` in Vercel after deployment

2. **If you want to keep us-central1:**
   - Edit `backend/cloudbuild.yaml` line 53: change `europe-west1` back to `us-central1`
   - Then commit and push

3. **After deployment:**
   - Get new service URL from Cloud Run console
   - Update Vercel environment variable `NEXT_PUBLIC_API_URL`
   - Redeploy frontend

