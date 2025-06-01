/*
  Warnings:

  - You are about to drop the column `country` on the `Beach` table. All the data in the column will be lost.
  - You are about to drop the column `forecast` on the `LogEntry` table. All the data in the column will be lost.
  - You are about to alter the column `surferRating` on the `LogEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `country` on the `Region` table. All the data in the column will be lost.
  - Added the required column `countryId` to the `Beach` table without a default value. This is not possible if the table is not empty.
  - Made the column `surferRating` on table `LogEntry` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `countryId` to the `Region` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Beach_country_idx";

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "categoryType" TEXT DEFAULT 'local',
ADD COLUMN     "customCategory" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "AdRequest" ADD COLUMN     "categoryType" TEXT DEFAULT 'local',
ADD COLUMN     "customCategory" TEXT,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Beach" DROP COLUMN "country",
ADD COLUMN     "countryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ForecastA" ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "LogEntry" DROP COLUMN "forecast",
ADD COLUMN     "forecastId" TEXT,
ALTER COLUMN "date" SET DATA TYPE DATE,
ALTER COLUMN "surferRating" SET NOT NULL,
ALTER COLUMN "surferRating" SET DEFAULT 0,
ALTER COLUMN "surferRating" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Region" DROP COLUMN "country",
ADD COLUMN     "countryId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AdClick" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "notificationMethod" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logEntryId" TEXT,
    "alertType" TEXT NOT NULL DEFAULT 'variables',
    "starRating" TEXT,
    "forecastDate" DATE NOT NULL,
    "forecastId" TEXT,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertCheck" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "details" TEXT,

    CONSTRAINT "AlertCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertNotification" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alertName" TEXT,
    "beachId" TEXT,
    "beachName" TEXT,
    "region" TEXT,

    CONSTRAINT "AlertNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "alertNotificationId" TEXT,
    "adId" TEXT,
    "adRequestId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "continent" TEXT,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertCheck_alertId_idx" ON "AlertCheck"("alertId");

-- CreateIndex
CREATE INDEX "AlertCheck_checkedAt_idx" ON "AlertCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "AlertNotification_alertId_idx" ON "AlertNotification"("alertId");

-- CreateIndex
CREATE INDEX "AlertNotification_createdAt_idx" ON "AlertNotification"("createdAt");

-- CreateIndex
CREATE INDEX "AlertNotification_region_idx" ON "AlertNotification"("region");

-- CreateIndex
CREATE INDEX "AlertNotification_beachId_idx" ON "AlertNotification"("beachId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_alertNotificationId_idx" ON "Notification"("alertNotificationId");

-- CreateIndex
CREATE INDEX "Notification_adId_idx" ON "Notification"("adId");

-- CreateIndex
CREATE INDEX "Notification_adRequestId_idx" ON "Notification"("adRequestId");

-- CreateIndex
CREATE INDEX "Beach_countryId_idx" ON "Beach"("countryId");

-- CreateIndex
CREATE INDEX "LogEntry_forecastId_idx" ON "LogEntry"("forecastId");

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "ForecastA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beach" ADD CONSTRAINT "Beach_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdClick" ADD CONSTRAINT "AdClick_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "ForecastA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_logEntryId_fkey" FOREIGN KEY ("logEntryId") REFERENCES "LogEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertCheck" ADD CONSTRAINT "AlertCheck_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertNotification" ADD CONSTRAINT "AlertNotification_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_adRequestId_fkey" FOREIGN KEY ("adRequestId") REFERENCES "AdRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_alertNotificationId_fkey" FOREIGN KEY ("alertNotificationId") REFERENCES "AlertNotification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
