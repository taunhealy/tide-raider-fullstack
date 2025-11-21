# Forecast Data Flow - How RaidLogTable Gets Forecast Data

## Data Flow Path

### 1. Database Schema

```
LogEntry {
  id: UUID
  forecastId: String? (foreign key)
  forecast: Forecast? (relation)
}

Forecast {
  id: UUID
  date: Date
  regionId: String
  windSpeed: Int
  swellHeight: Float
  ...
}
```

### 2. Backend Query (`logService.ts` - `getLogEntriesWithFilters`)

**Lines 492-502:**

```typescript
forecast: {
  select: {
    id: true,
    date: true,
    windSpeed: true,
    windDirection: true,
    swellHeight: true,
    swellPeriod: true,
    swellDirection: true,
  },
},
```

**How it works:**

- Prisma uses the `forecastId` foreign key to join the Forecast table
- Returns forecast data as part of the log entry response
- If `forecastId` is null, `forecast` will be null

### 3. API Response Structure

**Backend returns:**

```json
{
  "entries": [
    {
      "id": "f669700e-0b6f-4447-80ab-6003c3635e17",
      "forecastId": "1c30a6b0-d427-413e-a813-879b8ac1e01d",
      "forecast": {
        "id": "1c30a6b0-d427-413e-a813-879b8ac1e01d",
        "date": "2025-11-20T00:00:00.000Z",
        "windSpeed": 18,
        "swellHeight": 2.4,
        ...
      }
    }
  ]
}
```

### 4. Frontend Mapping (`useRaidLogs.ts`)

**Lines 182-200:**

```typescript
forecast: entry.forecast
  ? {
      id: entry.forecast.id,
      date: ...,
      windSpeed: entry.forecast.windSpeed ?? 0,
      ...
    }
  : null,
```

**How it works:**

- Maps `entry.forecast` from API response to LogEntry type
- Handles null forecasts gracefully
- Converts date to string format

### 5. RaidLogTable Display

**Line 1242:**

```typescript
<ForecastInfo forecast={entry.forecast} entry={entry} hasAccess={hasAccess} />
```

**How it works:**

- Receives `entry.forecast` directly from mapped data
- `ForecastInfo` component displays the forecast data
- Shows "No conditions" if forecast is null

## Connection Verification

### ✅ Correct Flow:

1. **LogEntry.forecastId** → Points to Forecast.id
2. **Backend includes forecast relation** → Prisma joins tables
3. **Frontend receives entry.forecast** → Already joined data
4. **RaidLogTable displays entry.forecast** → Direct access

### ❌ If Forecast is Null:

- `forecastId` is null in database → No forecast linked
- `forecastId` points to non-existent forecast → Relation broken
- Forecast exists but relation not included in query → Backend issue

## How to Verify

### Check via Postman:

**Get log entry with forecast:**

```
GET /api/raid-logs?id=f669700e-0b6f-4447-80ab-6003c3635e17
```

**Response should have:**

```json
{
  "forecastId": "1c30a6b0-d427-413e-a813-879b8ac1e01d",
  "forecast": {
    "id": "1c30a6b0-d427-413e-a813-879b8ac1e01d",
    "windSpeed": 18,
    ...
  }
}
```

### Check Database:

**SQL Query:**

```sql
SELECT
  le.id as log_id,
  le."forecastId",
  f.id as forecast_id,
  f."windSpeed",
  f."swellHeight"
FROM "LogEntry" le
LEFT JOIN "Forecast" f ON le."forecastId" = f.id
WHERE le.id = 'f669700e-0b6f-4447-80ab-6003c3635e17';
```

## Summary

**Yes, RaidLogTable fetches forecast through the log entry's forecast connection:**

1. ✅ **Database:** LogEntry.forecastId → Forecast.id (foreign key relation)
2. ✅ **Backend:** Includes forecast relation in Prisma query
3. ✅ **API:** Returns log entry with forecast object
4. ✅ **Frontend:** Maps entry.forecast from API response
5. ✅ **Display:** RaidLogTable uses entry.forecast directly

The forecast is **NOT** fetched separately - it comes **with** the log entry through the Prisma relation.
