/*
  Warnings:

  - You are about to drop the column `continent` on the `LogEntry` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `LogEntry` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `LogEntry` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `LogEntry` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "LogEntry_date_idx";

-- DropIndex
DROP INDEX "LogEntry_isPrivate_idx";

-- DropIndex
DROP INDEX "LogEntry_surferRating_idx";

-- AlterTable
ALTER TABLE "LogEntry" DROP COLUMN "continent",
DROP COLUMN "country",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
