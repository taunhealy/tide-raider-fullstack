# Link Forecast to Log Entry

## Problem Identified ✅

**Forecast EXISTS in database:**
- ID: `1c30a6b0-d427-413e-a813-879b8ac1e01d`
- Date: `2025-11-20`
- Region: `western-cape`
- Wind Speed: 18
- Swell Height: 2.4

**Log Entry has NO forecast linked:**
- Log ID: `f669700e-0b6f-4447-80ab-6003c3635e17`
- Forecast: `null`

## Solution: Link Forecast via Postman

### Step 1: Update Log Entry with Forecast ID

**Request:**
```
PUT https://tide-raider-backend.fly.dev/api/raid-logs
```

**Or via Next.js:**
```
PUT https://www.tideraider.com/api/raid-logs
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```
OR
```
Cookie: auth-token=YOUR_TOKEN
```

**Body:**
```json
{
  "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
  "forecastId": "1c30a6b0-d427-413e-a813-879b8ac1e01d"
}
```

### Step 2: Verify the Link

After updating, check the log entry again:

**Request:**
```
GET https://tide-raider-backend.fly.dev/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

**Expected Response:**
```json
{
  "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
  "forecastId": "1c30a6b0-d427-413e-a813-879b8ac1e01d",
  "forecast": {
    "id": "1c30a6b0-d427-413e-a813-879b8ac1e01d",
    "windSpeed": 18,
    "swellHeight": 2.4,
    ...
  }
}
```

## Alternative: Let Backend Auto-Link

You can also just send the date and regionId, and the backend will automatically find and link the forecast:

**Body:**
```json
{
  "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
  "date": "2025-11-20",
  "regionId": "western-cape"
}
```

The backend's `updateLogEntry` method will:
1. Look up forecast by date/region
2. Link it automatically if found

## Why This Happened

Possible reasons:
1. **Log was created before forecast was scraped** - Forecast might not have existed when log was created
2. **forecastId wasn't sent** - Frontend might not have included it in the create/update request
3. **Forecast lookup failed** - The automatic lookup by date/region might have failed during creation

## Prevention

To prevent this in the future:
1. **Always include forecastId** when creating/updating logs
2. **Verify forecast exists** before creating log entry
3. **Add retry logic** if forecast lookup fails during creation

