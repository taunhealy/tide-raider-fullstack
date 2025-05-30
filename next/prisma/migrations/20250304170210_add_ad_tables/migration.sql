/*
  Warnings:

  - You are about to drop the column `lemonSubscriptionId` on the `AdRequest` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AdRequest_payfastSubscriptionId_idx";

-- AlterTable
ALTER TABLE "AdRequest" DROP COLUMN "lemonSubscriptionId",
ADD COLUMN     "paypalSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "title" TEXT,
    "category" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "regionId" TEXT NOT NULL,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paypalSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "targetedBeaches" TEXT[],

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdBeachConnection" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "beachId" TEXT NOT NULL,

    CONSTRAINT "AdBeachConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ad_requestId_key" ON "Ad"("requestId");

-- CreateIndex
CREATE INDEX "Ad_regionId_idx" ON "Ad"("regionId");

-- CreateIndex
CREATE INDEX "Ad_category_idx" ON "Ad"("category");

-- CreateIndex
CREATE INDEX "Ad_status_idx" ON "Ad"("status");

-- CreateIndex
CREATE INDEX "Ad_userId_idx" ON "Ad"("userId");

-- CreateIndex
CREATE INDEX "Ad_country_idx" ON "Ad"("country");

-- CreateIndex
CREATE INDEX "AdBeachConnection_adId_idx" ON "AdBeachConnection"("adId");

-- CreateIndex
CREATE INDEX "AdBeachConnection_beachId_idx" ON "AdBeachConnection"("beachId");

-- CreateIndex
CREATE UNIQUE INDEX "AdBeachConnection_adId_beachId_key" ON "AdBeachConnection"("adId", "beachId");

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "AdRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdBeachConnection" ADD CONSTRAINT "AdBeachConnection_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdBeachConnection" ADD CONSTRAINT "AdBeachConnection_beachId_fkey" FOREIGN KEY ("beachId") REFERENCES "Beach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
