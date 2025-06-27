/*
  Warnings:

  - Changed the type of `optimalTide` on the `Beach` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OptimalTide" AS ENUM ('Low', 'Mid', 'High', 'All', 'Low_to_Mid', 'Mid_to_High', 'unknown');

-- AlterTable
ALTER TABLE "Beach" DROP COLUMN "optimalTide",
ADD COLUMN     "optimalTide" "OptimalTide" NOT NULL;
