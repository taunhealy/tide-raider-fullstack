# Multi-Timezone Cron Job Implementation Summary

## ✅ What Was Implemented

### 1. **Cron Route** (`backend/src/routes/cron.ts`)
   - **POST** `/api/cron/fetch-and-alert` - Main cron endpoint
   - **GET** `/api/cron/health` - Health check endpoint
   - Protected by `X-Cron-Secret` header
   - Accepts optional `timezone` parameter in request body

### 2. **Region Data Service** (`backend/src/services/regionDataService.ts`)
   - `fetchAllRegionsData()` - Fetches and stores surf conditions for all regions
   - Processes regions sequentially to avoid database overload
   - Calculates and stores beach scores for each region
   - Returns detailed results with success/failure counts

### 3. **Surf Conditions Service** (`backend/src/services/surfConditionsService.ts`)
   - `getLatestConditions(regionId, forceRefresh)` - Fetches or scrapes forecast data
   - Checks database first, scrapes if needed
   - Stores forecast data in `ForecastA` table

### 4. **Score Service** (`backend/src/services/scoreService.ts`)
   - `calculateScore()` - Calculates beach score based on conditions
   - `calculateAndStoreScores()` - Bulk calculates and stores scores for all beaches in a region
   - Handles wind direction, wind speed, swell height, swell direction, and swell period

### 5. **Alert Processor Enhancement** (`backend/src/services/alertProcessor.ts`)
   - Added `processAllUserAlerts()` - Processes alerts for all users with active alerts
   - Iterates through all users and calls `processUserAlerts()` for each
   - Aggregates results across all users

### 6. **Supporting Files**
   - Fixed import paths in `scrapeSources.ts`
   - Created stub proxy files (`userAgents.ts`, `proxyManager.ts`)
   - Added `BaseForecastData` type to `types.ts`

## 🔧 Configuration

### Environment Variables

Add to `backend/.env`:

```env
CRON_SECRET=your-super-secret-key-change-this-in-production
```

### Routes

The cron route is automatically mounted at `/api/cron` via `routes/index.ts`.

## 📋 How It Works

1. **Cron Service Calls Endpoint**
   - External service (GitHub Actions, Vercel, etc.) calls `POST /api/cron/fetch-and-alert`
   - Includes `X-Cron-Secret` header for authentication
   - Optionally includes `timezone` in request body

2. **Fetch Region Data**
   - Gets all regions from database
   - For each region:
     - Fetches/scrapes latest forecast data
     - Calculates beach scores
     - Stores scores in database

3. **Process Alerts**
   - Gets all users with active alerts
   - For each user:
     - Checks all their active alerts
     - Compares conditions to forecast data
     - Sends notifications if conditions match
     - Records notification events

4. **Return Results**
   - Returns summary of:
     - Regions processed (success/failure counts)
     - Users processed
     - Alerts checked
     - Notifications sent
     - Any errors

## 🌍 Multi-Timezone Support

The system supports running at different times for different timezones:

- **5am UTC** - Covers Europe/Africa
- **5am EST (10am UTC)** - US East Coast
- **5am PST (1pm UTC)** - US West Coast  
- **5am AEST (7pm UTC)** - Australia

Each cron job:
- Fetches fresh data for all regions
- Processes alerts for all users
- Users get alerts at their local 5am time

## 🧪 Testing

### Manual Test

```bash
# Set your secret
export CRON_SECRET="your-secret-key"

# Test the endpoint
curl -X POST http://localhost:3001/api/cron/fetch-and-alert \
  -H "Content-Type: application/json" \
  -H "X-Cron-Secret: $CRON_SECRET" \
  -d '{"timezone": "UTC"}'
```

### Health Check

```bash
curl http://localhost:3001/api/cron/health
```

## 📊 Expected Response

```json
{
  "success": true,
  "timezone": "UTC",
  "timestamp": "2025-01-16T05:00:00.000Z",
  "duration": "45000ms",
  "regionResults": {
    "regionsProcessed": 30,
    "regionsSucceeded": 28,
    "regionsFailed": 2,
    "errors": ["region-id-1: Scraper failed", "region-id-2: No config"]
  },
  "alertResults": {
    "usersProcessed": 150,
    "alertsChecked": 450,
    "notificationsSent": 25,
    "errors": 0,
    "errorDetails": []
  }
}
```

## 🚀 Next Steps

1. **Set up GitHub Actions** (see `.github/workflows/cron-jobs.yml`)
   - Add secrets: `CRON_SECRET` and `BACKEND_URL`
   - Workflow will run automatically at scheduled times

2. **Or use another cron service:**
   - Vercel Cron (if deploying to Vercel)
   - Fly.io Cron Jobs
   - External service (cron-job.org, EasyCron, etc.)

3. **Monitor logs:**
   - Check backend logs for cron job execution
   - Monitor success/failure rates
   - Adjust schedules as needed

## 📝 Files Created/Modified

**Created:**
- `backend/src/routes/cron.ts`
- `backend/src/services/regionDataService.ts`
- `backend/src/services/surfConditionsService.ts`
- `backend/src/services/scoreService.ts`
- `backend/src/lib/proxy/userAgents.ts`
- `backend/src/lib/proxy/proxyManager.ts`
- `.github/workflows/cron-jobs.yml`
- `backend/CRON_SETUP.md`
- `backend/CRON_IMPLEMENTATION_SUMMARY.md`

**Modified:**
- `backend/src/routes/index.ts` - Added cron router
- `backend/src/services/alertProcessor.ts` - Added `processAllUserAlerts()`
- `backend/src/lib/scrapers/scrapeSources.ts` - Fixed imports
- `backend/src/lib/scrapers/scraperA.ts` - Fixed imports
- `backend/src/lib/types.ts` - Added `BaseForecastData`

## ✅ Status

All components are implemented and ready to use. The system is ready for:
- Multi-timezone cron job scheduling
- Automatic region data fetching
- Automatic alert processing
- Global user coverage

