-- 1. Add the new columns
ALTER TABLE "IntelligenceReport" ADD COLUMN IF NOT EXISTS "duration" INTEGER DEFAULT 7;
ALTER TABLE "IntelligenceReport" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP WITH TIME ZONE;

-- 2. Migrate the data from legacy fields
UPDATE "IntelligenceReport" 
SET 
  "duration" = CASE WHEN "isWeekly" = true THEN 7 ELSE 1 END,
  "endDate" = "weekEndDate"
WHERE "isWeekly" IS NOT NULL;

-- 3. Update the unique constraint
-- First, drop the old constraint (Prisma usually names it after the explicit name or fields)
ALTER TABLE "IntelligenceReport" DROP CONSTRAINT IF EXISTS "intel_history_unique";

-- Add the new unique constraint including 'duration'
ALTER TABLE "IntelligenceReport" ADD CONSTRAINT "intel_history_unique" UNIQUE ("beachId", "userId", "date", "persona", "duration");

-- 4. (Optional) Remove old columns once you verify the migration
-- ALTER TABLE "IntelligenceReport" DROP COLUMN IF EXISTS "isWeekly";
-- ALTER TABLE "IntelligenceReport" DROP COLUMN IF EXISTS "weekEndDate";
