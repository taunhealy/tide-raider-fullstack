# Postman GET Request - Check Log Entry Forecast

## Step-by-Step Instructions

### 1. Open Postman
- Launch Postman application

### 2. Create New Request
- Click **"New"** button (top left)
- Select **"HTTP Request"**
- Or press `Ctrl+N` (Windows) / `Cmd+N` (Mac)

### 3. Set Request Method
- Method dropdown should already be set to **GET**
- If not, select **GET** from the dropdown

### 4. Enter URL

**Option A: Direct Backend URL (requires auth token)**
```
https://tide-raider-backend.fly.dev/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

**Option B: Via Next.js Proxy (uses cookies)**
```
https://www.tideraider.com/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

**Option C: Local Development**
```
http://localhost:3000/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

### 5. Add Authentication

#### Method 1: Bearer Token (for direct backend)
1. Click **"Authorization"** tab
2. Select **"Bearer Token"** from Type dropdown
3. Paste your JWT token in the Token field

#### Method 2: Cookie (for Next.js proxy)
1. Click **"Headers"** tab
2. Click **"Add Header"**
3. Key: `Cookie`
4. Value: `auth-token=YOUR_TOKEN_HERE`

### 6. Send Request
- Click the blue **"Send"** button (right side)

### 7. Check Response

Look for these fields in the JSON response:

```json
{
  "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
  "forecastId": "some-id-or-null",  // ← Check this
  "forecast": {                      // ← Check this
    "id": "...",
    "windSpeed": 16,
    "swellHeight": 2.8,
    ...
  }
}
```

## What to Look For

### ✅ Forecast Linked (Good)
```json
{
  "forecastId": "abc123-forecast-id",
  "forecast": {
    "id": "abc123-forecast-id",
    "windSpeed": 16,
    "swellHeight": 2.8
  }
}
```

### ❌ No Forecast (Problem)
```json
{
  "forecastId": null,
  "forecast": null
}
```

### ⚠️ Broken Relation (Problem)
```json
{
  "forecastId": "abc123-forecast-id",
  "forecast": null  // ID exists but relation broken
}
```

## Quick Copy-Paste URLs

### Production (via Next.js)
```
GET https://www.tideraider.com/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

### Direct Backend
```
GET https://tide-raider-backend.fly.dev/api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

## Alternative: Get All Logs (to see multiple entries)

```
GET https://www.tideraider.com/api/raid-logs?page=1&limit=10
```

This will return an array of entries, each with their forecast data.

## Troubleshooting

### 401 Unauthorized
- Add authentication (Bearer token or Cookie)
- Make sure token is valid

### 404 Not Found
- Check the log entry ID is correct
- Verify the endpoint URL

### 500 Server Error
- Check backend logs
- Verify database connection

