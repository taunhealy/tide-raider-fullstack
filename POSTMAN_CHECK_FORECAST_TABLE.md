# Postman - Check Forecast Table Data

## Method 1: Check Forecast for Specific Date (Recommended)

### Request

**Method:** `GET`

**URL:**

```
https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape&forecastDate=2025-11-20
```

**Or via Next.js:**

```
https://www.tideraider.com/api/forecast?regionId=western-cape&forecastDate=2025-11-20
```

**Query Parameters:**

- `regionId` (required): `western-cape`
- `forecastDate` (optional): `2025-11-20` (YYYY-MM-DD format)
- `source` (optional): `WINDFINDER`, `WINDGURU`, or `WINDY` (default: WINDFINDER)

**Response:**

```json
{
  "id": "1c30a6b0-d427-413e-a813-879b8ac1e01d",
  "date": "2025-11-20T00:00:00.000Z",
  "regionId": "western-cape",
  "source": "WINDFINDER",
  "windSpeed": 18,
  "windDirection": 151.03,
  "swellHeight": 2.4,
  "swellPeriod": 15,
  "swellDirection": 224.5
}
```

### Test Multiple Dates

**Today:**

```
GET /api/forecast?regionId=western-cape
```

**Yesterday:**

```
GET /api/forecast?regionId=western-cape&forecastDate=2025-11-20
```

**Tomorrow:**

```
GET /api/forecast?regionId=western-cape&forecastDate=2025-11-22
```

**Day After Tomorrow:**

```
GET /api/forecast?regionId=western-cape&forecastDate=2025-11-23
```

## Method 2: Check Forecast via Filtered Beaches (Shows Forecast + Beach Scores)

### Request

**Method:** `GET`

**URL:**

```
https://tide-raider-backend.fly.dev/api/filtered-beaches?regionId=western-cape&forecastDate=2025-11-20
```

**Response includes:**

```json
{
  "beaches": [...],
  "scores": {...},
  "forecast": {
    "id": "1c30a6b0-d427-413e-a813-879b8ac1e01d",
    "date": "2025-11-20T00:00:00.000Z",
    "windSpeed": 18,
    "swellHeight": 2.4,
    ...
  }
}
```

## Method 3: Check Forecasts for Multiple Dates (Compare Data)

### Test Sequence

1. **Check Nov 20:**

   ```
   GET /api/forecast?regionId=western-cape&forecastDate=2025-11-20
   ```

2. **Check Nov 21:**

   ```
   GET /api/forecast?regionId=western-cape&forecastDate=2025-11-21
   ```

3. **Check Nov 22:**
   ```
   GET /api/forecast?regionId=western-cape&forecastDate=2025-11-22
   ```

**Expected:** Each date should return different forecast values if data exists.

## What to Check

### ✅ Forecasts Are Being Saved Correctly

- Different dates return different values
- Each forecast has a unique `id`
- `date` field matches the requested date
- `windSpeed`, `swellHeight`, etc. have valid values

### ❌ Forecasts Are NOT Being Saved Correctly

- Same values for all dates (indicates date filtering not working)
- Missing `id` field
- `date` field doesn't match requested date
- All values are 0 or null

## Quick Postman Collection

### Request 1: Today's Forecast

```
GET https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape
```

### Request 2: Specific Date

```
GET https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape&forecastDate=2025-11-20
```

### Request 3: Different Date

```
GET https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape&forecastDate=2025-11-21
```

### Request 4: Force Refresh (Trigger Scrape)

```
GET https://tide-raider-backend.fly.dev/api/forecast?regionId=western-cape&forecastDate=2025-11-20&forceRefresh=true
```

## Note: Direct Database Access

**There is NO API endpoint to query the Forecast table directly** (like `GET /api/forecasts`).

To see all forecasts in the database, you need:

- **Prisma Studio:** `cd backend && npx prisma studio`
- **SQL Query:** Direct database access
- **Use the forecast endpoint** with different dates to check individual records

## Expected Database Structure

Based on Prisma schema, forecasts are stored with:

- `id`: UUID (primary key)
- `date`: Date (YYYY-MM-DD)
- `regionId`: String (e.g., "western-cape")
- `source`: Enum (WINDFINDER, WINDGURU, WINDY)
- `windSpeed`: Int
- `windDirection`: Float
- `swellHeight`: Float
- `swellPeriod`: Int
- `swellDirection`: Float

**Unique constraint:** `[date, regionId, source]` - One forecast per date/region/source combination
