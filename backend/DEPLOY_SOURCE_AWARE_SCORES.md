# Deploy Source-Aware Beach Scores

## Summary of Changes

This deployment adds source-specific scoring to beach forecasts, allowing users to see different beach recommendations when switching between forecast sources (A/Windfinder, B/Windguru, C/Windy).

## Changes Made

### 1. Database Schema (Prisma)

- Added `source` field to `BeachDailyScore` model
- Updated unique constraint to include source: `[beachId, date, source]`
- Added indexes for performance

### 2. Backend Code

- **filtered-beaches.ts**: Now filters beach scores by selected source
- **scoreService.ts**: Calculates and stores scores per source
- **regionDataService.ts**: Generates scores for each available source during scraping

### 3. Migration File

Created: `backend/prisma/migrations/20251124155049_add_source_to_beach_daily_score/migration.sql`

## Deployment Steps

### Step 1: Push Code Changes

```bash
git add .
git commit -m "feat: Add source-aware beach scoring (A/B/C sources)"
git push origin main
```

### Step 2: Run Database Migration

**Option A: Manual Migration (Recommended)**

```bash
# Connect to your Cloud Run service
gcloud run services describe tide-raider-backend --region=europe-west1

# SSH into a Cloud Run container or run locally with production DATABASE_URL
cd backend
npx prisma migrate deploy
```

**Option B: Via Cloud Build (if configured)**
The migration will run automatically if you've set up Cloud Build to run migrations.

### Step 3: Regenerate Scores

After migration, you should regenerate scores for all sources:

```bash
# Trigger the cron job or call the API endpoint
curl -X POST https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app/api/cron/calculate-scores
```

## Frontend Deployment

The frontend code has already been updated to use the correct backend URL. Deploy the frontend:

```bash
cd next
git add .
git commit -m "fix: Update backend URLs for Cloud Run CORS"
git push origin main
```

Vercel will automatically deploy the changes.

## Testing

1. Visit: https://www.tideraider.com/raid?regionId=western-cape
2. Select tomorrow's date
3. Click source buttons A, B, C
4. Verify that:
   - Forecast data at the top changes
   - Beach cards now update with different scores for each source

## Rollback Plan

If issues occur, you can roll back:

```sql
-- Remove source column
ALTER TABLE "BeachDailyScore" DROP COLUMN "source";

-- Restore original unique constraint
DROP INDEX "BeachDailyScore_beachId_date_source_key";
CREATE UNIQUE INDEX "BeachDailyScore_beachId_date_key" ON "BeachDailyScore"("beachId", "date");
```

Then redeploy the previous code version.

## Notes

- Default source is set to "WINDFINDER" for backward compatibility
- Existing scores will remain but won't have source differentiation until regenerated
- The cron job will now generate scores for all available sources per region
- Each beach can have up to 3 scores per day (one per source)
