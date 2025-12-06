# Delete Forecast Scripts

## Problem: Forecasts Reverting to Wrong Dates

If forecasts are showing the wrong date when you select different days, it's likely because:

1. **Stale data in database** - Old forecasts for future dates exist
2. **Backend fallback mechanism** - If no exact match is found, it returns the most recent forecast (see `backend/src/routes/forecast.ts` lines 87-108)
3. **Frontend React Query cache** - Cached data might be stale (5 minute cache)

## Solution: Delete Future Forecasts

### Delete ALL Forecast Sources (Recommended)

```bash
cd backend
npx tsx scripts/delete-future-forecasts.ts
```

This deletes:

- ✅ All `Forecast` records for today and future dates (WINDFINDER, WINDGURU, WINDY)
- ✅ All `BeachDailyScore` records for today and future dates (all sources)
- ✅ Forces fresh scraping when forecasts are requested

### Delete for Specific Region

```bash
cd backend
npx tsx scripts/delete-future-forecasts.ts western-cape
```

### Other Delete Scripts

- `delete-today-forecasts.ts` - Delete only today's forecasts (all sources)
- `delete-windy-forecasts.ts` - Delete only WINDY source forecasts
- `delete-windfinder-forecasts.ts` - Delete only WINDFINDER source forecasts

## After Running the Script

1. **Forecasts will be re-scraped** automatically when requested via the API
2. **Beach scores will be recalculated** when new forecasts are scraped
3. **No manual intervention needed** - the cron job or API requests will trigger fresh scraping

## Verify It Worked

```bash
# Check forecast count (should be 0 for today and future)
cd backend
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const count = await prisma.forecast.count({
  where: { date: { gte: today } }
});
console.log('Future forecasts:', count);
await prisma.\$disconnect();
"
```

## Frontend Cache

The frontend uses React Query with:

- `staleTime: 60 * 1000` (1 minute)
- `gcTime: 5 * 60 * 1000` (5 minutes cache)

If you still see stale data after deleting:

1. Hard refresh the browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Or wait 5 minutes for cache to expire

## Redis Cache

Redis cache expires at end of day automatically, so no manual clearing needed.
