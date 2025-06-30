/*
  Warnings:

  - You are about to drop the `ForecastB` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "BeachDailyScore" ALTER COLUMN "score" SET DEFAULT 0;

-- DropTable
DROP TABLE "ForecastB";
