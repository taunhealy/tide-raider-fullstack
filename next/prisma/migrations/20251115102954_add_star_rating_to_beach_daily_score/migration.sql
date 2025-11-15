-- AlterTable
ALTER TABLE "BeachDailyScore" ADD COLUMN     "starRating" INTEGER;

-- CreateIndex
CREATE INDEX "BeachDailyScore_beachId_date_idx" ON "BeachDailyScore"("beachId", "date");

-- CreateIndex
CREATE INDEX "BeachDailyScore_starRating_idx" ON "BeachDailyScore"("starRating");
