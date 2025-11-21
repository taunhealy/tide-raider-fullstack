# Postman - Check Forecast Table

## Method 1: Get Forecast for Specific Date/Region

### Request Details

**Method:** `GET`

**URL:**
```
https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape&forecastDate=2025-11-20
```

**Or via Next.js proxy:**
```
https://www.tideraider.com/api/forecast?regionId=western-cape&forecastDate=2025-11-20
```

**Query Parameters:**
- `regionId` (required): `western-cape`
- `forecastDate` (optional): `2025-11-20` (YYYY-MM-DD format)
- `source` (optional): `WINDFINDER`, `WINDGURU`, or `WINDY` (default: WINDFINDER)
- `forceRefresh` (optional): `true` to force re-scrape

**Headers:**
- Optional: `Authorization: Bearer YOUR_TOKEN`
- Or: `Cookie: auth-token=YOUR_TOKEN`

### Example URLs

**Check forecast for Nov 20, 2025:**
```
GET https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape&forecastDate=2025-11-20
```

**Check today's forecast:**
```
GET https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape
```

**Force refresh and scrape:**
```
GET https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape&forecastDate=2025-11-20&forceRefresh=true
```

### Expected Response

**✅ Forecast Found:**
```json
{
  "id": "forecast-uuid",
  "date": "2025-11-20T00:00:00.000Z",
  "regionId": "western-cape",
  "source": "WINDFINDER",
  "windSpeed": 16,
  "windDirection": 147.71,
  "swellHeight": 2.8,
  "swellPeriod": 15,
  "swellDirection": 218.88
}
```

**❌ No Forecast:**
```json
{
  "error": "No forecast data found for the requested date"
}
```

## Method 2: Check Forecast via Filtered Beaches Endpoint

This endpoint also returns forecast data along with beach scores:

**URL:**
```
GET https://tide-raider-backend.fly.dev/api/filtered-beaches?regionId=western-cape&date=2025-11-20
```

**Response includes:**
```json
{
  "beaches": [...],
  "scores": {...},
  "forecast": {
    "windSpeed": 16,
    "swellHeight": 2.8,
    ...
  }
}
```

## Method 3: Check Forecast via Log Entry

Check if a specific log entry has a forecast linked:

**URL:**
```
GET https://tide-raider-backend.fly.dev/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

**Check response for:**
```json
{
  "forecastId": "...",
  "forecast": {
    "windSpeed": 16,
    ...
  }
}
```

## Step-by-Step Postman Setup

### 1. Create New Request
- Click **"New"** → **"HTTP Request"**

### 2. Set Method
- Select **GET**

### 3. Enter URL
```
https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape&forecastDate=2025-11-20
```

### 4. Add Query Parameters (Alternative Method)
- Click **"Params"** tab
- Add parameter:
  - Key: `regionId`, Value: `western-cape`
- Add parameter:
  - Key: `forecastDate`, Value: `2025-11-20`

### 5. Add Authentication (Optional)
- **Headers** tab → Add:
  - Key: `Cookie`, Value: `auth-token=YOUR_TOKEN`
- Or **Authorization** tab → Bearer Token

### 6. Send Request
- Click **"Send"**

## Testing Different Scenarios

### Test 1: Check if forecast exists for log entry date
```
GET /api/forecast?regionId=western-cape&forecastDate=2025-11-20
```
**Expected:** Should return forecast data if it exists in database

### Test 2: Check today's forecast
```
GET /api/forecast?regionId=western-cape
```
**Expected:** Returns today's forecast (if scraped)

### Test 3: Force scrape if missing
```
GET /api/forecast?regionId=western-cape&forecastDate=2025-11-20&forceRefresh=true
```
**Expected:** Scrapes and saves forecast, then returns it

## What to Look For

### ✅ Forecasts Are Being Saved
- Response returns forecast data with `windSpeed`, `swellHeight`, etc.
- Multiple dates return different forecasts
- `id` field exists (means it's in database)

### ❌ Forecasts Are NOT Being Saved
- Always returns 404 "No forecast data found"
- Even with `forceRefresh=true`, no data appears
- Check backend logs for scraping errors

## Quick Test Checklist

1. ✅ Check forecast for Nov 20, 2025 (log entry date)
2. ✅ Check forecast for today
3. ✅ Check forecast for yesterday
4. ✅ Try force refresh to trigger scrape
5. ✅ Check if forecast is linked to log entry

## Troubleshooting

### Always Getting 404
- Forecast might not be scraped for that date
- Try `forceRefresh=true` to trigger scrape
- Check backend logs for scraping errors

### Getting Forecast But Not Linked to Log
- Forecast exists but `forecastId` not set on log entry
- Use PUT request to update log entry with `forecastId`

### No Forecast Data in Response
- Check if scraping is working
- Verify region ID is correct
- Check database connection

