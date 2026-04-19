-- Drop legacy unique indexes that are blocking multi-slot data
-- These are covered by newer indexes that include timeSlot.
-- This is a non-destructive operation on table data.

DROP INDEX IF EXISTS "Forecast_date_regionId_source_key";
DROP INDEX IF EXISTS "BeachDailyScore_beachId_date_source_key";
