/*
  Warnings:

  - You are about to drop the column `region` on the `BeachDailyScore` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ForecastA` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `ForecastA` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ForecastA` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `LogEntry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date,regionId]` on the table `ForecastA` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `regionId` to the `BeachDailyScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regionId` to the `ForecastA` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regionId` to the `LogEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BeachDailyScore_beachId_date_idx";

-- DropIndex
DROP INDEX "BeachDailyScore_date_region_idx";

-- DropIndex
DROP INDEX "BeachDailyScore_score_idx";

-- DropIndex
DROP INDEX "ForecastA_date_region_key";

-- AlterTable
ALTER TABLE "BeachDailyScore" DROP COLUMN "region",
ADD COLUMN     "regionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ForecastA" DROP COLUMN "createdAt",
DROP COLUMN "region",
DROP COLUMN "updatedAt",
ADD COLUMN     "regionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LogEntry" DROP COLUMN "region",
ADD COLUMN     "regionId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "BeachDailyScore_regionId_idx" ON "BeachDailyScore"("regionId");

-- CreateIndex
CREATE INDEX "ForecastA_regionId_idx" ON "ForecastA"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastA_date_regionId_key" ON "ForecastA"("date", "regionId");

-- CreateIndex
CREATE INDEX "LogEntry_regionId_idx" ON "LogEntry"("regionId");

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachDailyScore" ADD CONSTRAINT "BeachDailyScore_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastA" ADD CONSTRAINT "ForecastA_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
