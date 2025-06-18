/*
  Warnings:

  - The `starRating` column on the `Alert` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `BeachGoodRating` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "beachId" TEXT,
DROP COLUMN "starRating",
ADD COLUMN     "starRating" INTEGER;

-- DropTable
DROP TABLE "BeachGoodRating";

-- CreateTable
CREATE TABLE "BeachDailyScore" (
    "id" TEXT NOT NULL,
    "beachId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "conditions" JSONB NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeachDailyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorGlobal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BeachDailyScore_date_region_idx" ON "BeachDailyScore"("date", "region");

-- CreateIndex
CREATE INDEX "BeachDailyScore_beachId_date_idx" ON "BeachDailyScore"("beachId", "date");

-- CreateIndex
CREATE INDEX "BeachDailyScore_score_idx" ON "BeachDailyScore"("score");

-- CreateIndex
CREATE UNIQUE INDEX "BeachDailyScore_beachId_date_key" ON "BeachDailyScore"("beachId", "date");

-- AddForeignKey
ALTER TABLE "BeachDailyScore" ADD CONSTRAINT "BeachDailyScore_beachId_fkey" FOREIGN KEY ("beachId") REFERENCES "Beach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_beachId_fkey" FOREIGN KEY ("beachId") REFERENCES "Beach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
