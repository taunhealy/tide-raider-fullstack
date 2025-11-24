-- AlterTable
ALTER TABLE "BeachDailyScore" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'WINDFINDER';

-- DropIndex
DROP INDEX "BeachDailyScore_beachId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "BeachDailyScore_beachId_date_source_key" ON "BeachDailyScore"("beachId", "date", "source");

-- CreateIndex
CREATE INDEX "BeachDailyScore_source_idx" ON "BeachDailyScore"("source");

-- CreateIndex
CREATE INDEX "BeachDailyScore_regionId_date_source_idx" ON "BeachDailyScore"("regionId", "date", "source");

