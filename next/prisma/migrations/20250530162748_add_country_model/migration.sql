/*
  Warnings:

  - You are about to drop the column `continent` on the `Country` table. All the data in the column will be lost.
  - Added the required column `continentId` to the `Country` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Country" DROP COLUMN "continent",
ADD COLUMN     "continentId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Continent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Continent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Country" ADD CONSTRAINT "Country_continentId_fkey" FOREIGN KEY ("continentId") REFERENCES "Continent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
