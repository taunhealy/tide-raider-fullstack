# Deploy Backend Forecast Fallback Fix

## Quick Deploy Command

From the project root, run:

```powershell
cd backend
gcloud builds submit --config=cloudbuild.yaml --substitutions=_REGION=us-central1,_SERVICE_NAME=tide-raider-backend
```

## What This Fixes

The backend now has **fallback logic** for forecast endpoints:
- ✅ If exact date not found → returns most recent forecast for same source
- ✅ If still not found → returns most recent forecast for any source
- ✅ Only returns 404 if absolutely no forecast data exists

## Expected Result

After deployment:
- WeatherForecastWidget will show forecast data even when today's date isn't available
- It will display the most recent available forecast (e.g., 2025-11-23 if 2025-11-22 isn't available)
- No more "No forecast data available" when data exists in database

## Verify Deployment

After deployment completes (takes ~5-10 minutes), test:

```bash
# Test the forecast endpoint
curl "https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app/api/forecast?regionId=bali&forecastDate=2025-11-22&source=WINDFINDER"
```

You should get forecast data (even if it's from 2025-11-23) instead of 404.

## Note About Hydration Mismatch

The hydration mismatch error you're seeing is from **browser extensions** (like password managers) that add `fdprocessedid` attributes to buttons. This is harmless and doesn't affect functionality. It's a known React/Next.js issue with browser extensions.

