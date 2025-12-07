# Forecast Auto-Scraping Added

## Problem

The forecast endpoint (`/api/forecast`) was only querying the database and returning 404 when data didn't exist. It was **not triggering scraping** to fetch fresh data, unlike the `filtered-beaches` endpoint which does trigger scraping.

## Solution

Added automatic scraping logic to the forecast endpoint that:

1. **Detects missing data** - When a forecast is not found in the database
2. **Checks if scraping is appropriate** - Only scrapes for today or future dates (not past dates)
3. **Triggers scraping** - Calls `getLatestConditions()` which:
   - Scrapes forecast data from the source (WINDFINDER, WINDGURU, or WINDY)
   - Stores multiple days of forecasts (today, tomorrow, day after) in the database
   - Returns the scraped forecast
4. **Re-queries database** - After scraping, queries again for the specific requested date
5. **Returns data or 404** - Returns the forecast if found, or 404 if still not available

## Code Changes

### Added Import
```typescript
import { getLatestConditions } from "../services/surfConditionsService";
```

### Added Scraping Logic
When forecast is not found:
- Checks if the requested date is today or future
- Triggers scraping via `getLatestConditions()`
- Re-queries the database for the specific date
- Returns the forecast if found, or 404 if still missing

## Behavior

### Before
- Request forecast for today → 404 (no data)
- User has to manually trigger scraping or wait for cron job

### After
- Request forecast for today → Automatically scrapes → Returns data
- Request forecast for tomorrow → Automatically scrapes → Returns data (if available)
- Request forecast for past date → 404 (no scraping for past dates)

## Scraping Details

The `getLatestConditions()` function:
- Scrapes **multiple days** of forecasts (today + 2-3 future days)
- Stores all scraped forecasts in the database
- Handles errors gracefully (doesn't crash the endpoint)
- Uses `forceRefresh` parameter when provided

## Error Handling

- If scraping fails, the endpoint still returns 404 (doesn't return 500)
- Scraping errors are logged but don't break the request
- Network issues or scraper failures are handled gracefully

## Performance

- Scraping adds ~2-5 seconds to the request time
- Subsequent requests for the same date are fast (cached in DB)
- Scraping only happens when data is missing (not on every request)

## Testing

To test the auto-scraping:

1. Delete today's forecast data:
   ```bash
   cd backend
   npx tsx scripts/delete-future-forecasts.ts
   ```

2. Request forecast for today:
   ```bash
   curl "http://localhost:3001/api/forecast?regionId=western-cape&source=WINDFINDER"
   ```

3. Check logs for:
   - `[forecast] 🚨 No forecast found... triggering scrape...`
   - `[forecast] ⏱️ Scrape completed in Xms`
   - `[forecast] ✅ Scraping successful...`

4. The response should include forecast data (not 404)

## Related Files

- `backend/src/routes/forecast.ts` - Main endpoint with scraping logic
- `backend/src/services/surfConditionsService.ts` - Scraping service
- `backend/src/routes/filtered-beaches.ts` - Similar scraping logic (reference)

