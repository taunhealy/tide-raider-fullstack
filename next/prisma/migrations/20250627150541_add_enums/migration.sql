/*
  Warnings:

  - The values [Low,Mid,High,All,Low_to_Mid,Mid_to_High,unknown] on the enum `OptimalTide` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `difficulty` on the `Beach` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `waveType` on the `Beach` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "WaveType" AS ENUM ('BEACH_BREAK', 'POINT_BREAK', 'REEF_BREAK', 'RIVER_MOUTH');

-- AlterEnum
BEGIN;
CREATE TYPE "OptimalTide_new" AS ENUM ('LOW', 'MID', 'HIGH', 'ALL', 'LOW_TO_MID', 'MID_TO_HIGH', 'UNKNOWN');
ALTER TABLE "Beach" ALTER COLUMN "optimalTide" TYPE "OptimalTide_new" USING ("optimalTide"::text::"OptimalTide_new");
ALTER TYPE "OptimalTide" RENAME TO "OptimalTide_old";
ALTER TYPE "OptimalTide_new" RENAME TO "OptimalTide";
DROP TYPE "OptimalTide_old";
COMMIT;

-- AlterTable
ALTER TABLE "Beach" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL,
DROP COLUMN "waveType",
ADD COLUMN     "waveType" "WaveType" NOT NULL;

-- CreateIndex
CREATE INDEX "Beach_waveType_idx" ON "Beach"("waveType");

-- CreateIndex
CREATE INDEX "Beach_difficulty_idx" ON "Beach"("difficulty");
