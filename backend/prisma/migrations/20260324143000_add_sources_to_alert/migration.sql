-- AlterTable
ALTER TABLE "Alert" ADD COLUMN "sources" "ForecastSource"[] NOT NULL DEFAULT ARRAY['WINDFINDER']::"ForecastSource"[];
