-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- Migration: add_source_to_beach_daily_score
-- ============================================================

-- Step 1: Add source column with default value
ALTER TABLE "BeachDailyScore" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'WINDFINDER';

-- Step 2: Drop old unique constraint
DROP INDEX IF EXISTS "BeachDailyScore_beachId_date_key";

-- Step 3: Create new unique constraint with source
CREATE UNIQUE INDEX "BeachDailyScore_beachId_date_source_key" 
ON "BeachDailyScore"("beachId", "date", "source");

-- Step 4: Create performance indexes
CREATE INDEX "BeachDailyScore_source_idx" 
ON "BeachDailyScore"("source");

CREATE INDEX "BeachDailyScore_regionId_date_source_idx" 
ON "BeachDailyScore"("regionId", "date", "source");

-- Step 5: Mark migration as applied in Prisma
INSERT INTO "_prisma_migrations" (
  "id", 
  "checksum", 
  "finished_at", 
  "migration_name", 
  "logs", 
  "rolled_back_at", 
  "started_at", 
  "applied_steps_count"
) VALUES (
  gen_random_uuid()::text,
  'e8a7c4b5d9f2a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1',
  NOW(),
  '20251124155049_add_source_to_beach_daily_score',
  NULL,
  NULL,
  NOW(),
  1
);

-- Verification queries (run these after to confirm)
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'BeachDailyScore' AND column_name = 'source';

