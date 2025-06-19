/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `properties` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Alert` table. All the data in the column will be lost.
  - The `alertType` column on the `Alert` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `regionId` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('VARIABLES', 'RATING');

-- DropForeignKey
ALTER TABLE "AlertCheck" DROP CONSTRAINT "AlertCheck_alertId_fkey";

-- DropForeignKey
ALTER TABLE "AlertNotification" DROP CONSTRAINT "AlertNotification_alertId_fkey";

-- AlterTable
ALTER TABLE "Alert" DROP COLUMN "createdAt",
DROP COLUMN "properties",
DROP COLUMN "region",
DROP COLUMN "updatedAt",
ADD COLUMN     "regionId" TEXT NOT NULL,
DROP COLUMN "alertType",
ADD COLUMN     "alertType" "AlertType" NOT NULL DEFAULT 'VARIABLES';

-- CreateTable
CREATE TABLE "AlertProperty" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "property" TEXT NOT NULL,
    "optimalValue" DOUBLE PRECISION NOT NULL,
    "range" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AlertProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertProperty_alertId_idx" ON "AlertProperty"("alertId");

-- CreateIndex
CREATE INDEX "Alert_forecastId_idx" ON "Alert"("forecastId");

-- CreateIndex
CREATE INDEX "Alert_logEntryId_idx" ON "Alert"("logEntryId");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_beachId_idx" ON "Alert"("beachId");

-- CreateIndex
CREATE INDEX "Alert_regionId_idx" ON "Alert"("regionId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertCheck" ADD CONSTRAINT "AlertCheck_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertNotification" ADD CONSTRAINT "AlertNotification_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertProperty" ADD CONSTRAINT "AlertProperty_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
