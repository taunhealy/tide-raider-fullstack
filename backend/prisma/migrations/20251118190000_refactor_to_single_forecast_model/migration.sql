-- CreateEnum
CREATE TYPE "ForecastSource" AS ENUM ('WINDFINDER', 'WINDGURU');

-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "regionId" TEXT NOT NULL,
    "source" "ForecastSource" NOT NULL,
    "windSpeed" INTEGER NOT NULL DEFAULT 0,
    "windDirection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "swellHeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "swellPeriod" INTEGER NOT NULL DEFAULT 0,
    "swellDirection" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Forecast_date_regionId_source_key" ON "Forecast"("date", "regionId", "source");

-- CreateIndex
CREATE INDEX "Forecast_regionId_idx" ON "Forecast"("regionId");

-- CreateIndex
CREATE INDEX "Forecast_source_idx" ON "Forecast"("source");

-- CreateIndex
CREATE INDEX "Forecast_date_regionId_idx" ON "Forecast"("date", "regionId");

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing ForecastA data to Forecast with WINDFINDER source
INSERT INTO "Forecast" ("id", "date", "regionId", "source", "windSpeed", "windDirection", "swellHeight", "swellPeriod", "swellDirection")
SELECT "id", "date", "regionId", 'WINDFINDER'::"ForecastSource", "windSpeed", "windDirection", "swellHeight", "swellPeriod", "swellDirection"
FROM "ForecastA";

-- Migrate existing ForecastB data to Forecast with WINDGURU source (if any exists)
INSERT INTO "Forecast" ("id", "date", "regionId", "source", "windSpeed", "windDirection", "swellHeight", "swellPeriod", "swellDirection")
SELECT gen_random_uuid()::text, "date", "regionId", 'WINDGURU'::"ForecastSource", "windSpeed", "windDirection", "swellHeight", "swellPeriod", "swellDirection"
FROM "ForecastB"
ON CONFLICT ("date", "regionId", "source") DO NOTHING;

-- Drop foreign key constraints that reference ForecastA/ForecastB
ALTER TABLE "Alert" DROP CONSTRAINT IF EXISTS "Alert_forecastId_fkey";
ALTER TABLE "LogEntry" DROP CONSTRAINT IF EXISTS "LogEntry_forecastId_fkey";
ALTER TABLE "ForecastA" DROP CONSTRAINT IF EXISTS "ForecastA_regionId_fkey";
ALTER TABLE "ForecastB" DROP CONSTRAINT IF EXISTS "ForecastB_regionId_fkey";

-- Drop the old tables
DROP TABLE IF EXISTS "ForecastA";
DROP TABLE IF EXISTS "ForecastB";

-- Recreate foreign key constraints pointing to the new Forecast table
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "Forecast"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "Forecast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

