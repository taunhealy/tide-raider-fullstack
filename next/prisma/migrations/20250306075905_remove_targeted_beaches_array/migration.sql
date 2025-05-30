/*
  Warnings:

  - You are about to drop the column `targetedBeaches` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `payfastSubscriptionId` on the `AdRequest` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Ad_country_idx";

-- AlterTable
ALTER TABLE "Ad" DROP COLUMN "targetedBeaches";

-- AlterTable
ALTER TABLE "AdRequest" DROP COLUMN "payfastSubscriptionId";
