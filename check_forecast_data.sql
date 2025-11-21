-- Check forecast data for log entries
-- Run this in your database to verify forecast data exists

-- 1. Check how many log entries have forecastId set
SELECT 
  COUNT(*) as total_logs,
  COUNT(forecast_id) as logs_with_forecast_id,
  COUNT(*) - COUNT(forecast_id) as logs_without_forecast_id
FROM "LogEntry";

-- 2. Check forecast data for log entries with forecastId
SELECT 
  le.id as log_entry_id,
  le.date,
  le."beachName",
  le."surferRating",
  f.id as forecast_id,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection",
  CASE 
    WHEN f."windSpeed" IS NULL AND f."windDirection" IS NULL 
         AND f."swellHeight" IS NULL AND f."swellPeriod" IS NULL 
         AND f."swellDirection" IS NULL 
    THEN 'No data'
    ELSE 'Has data'
  END as forecast_status
FROM "LogEntry" le
LEFT JOIN "Forecast" f ON le."forecastId" = f.id
ORDER BY le.date DESC
LIMIT 20;

-- 3. Check specific log entry (replace with actual log entry ID)
-- SELECT 
--   le.id,
--   le."beachName",
--   le.date,
--   le."forecastId",
--   f."windSpeed",
--   f."windDirection",
--   f."swellHeight",
--   f."swellPeriod",
--   f."swellDirection"
-- FROM "LogEntry" le
-- LEFT JOIN "Forecast" f ON le."forecastId" = f.id
-- WHERE le.id = 'YOUR_LOG_ENTRY_ID_HERE';

-- 4. Check forecasts with all null values (these won't display)
SELECT 
  f.id,
  f.date,
  f."regionId",
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection"
FROM "Forecast" f
WHERE f."windSpeed" IS NULL 
  AND f."windDirection" IS NULL 
  AND f."swellHeight" IS NULL 
  AND f."swellPeriod" IS NULL 
  AND f."swellDirection" IS NULL
LIMIT 10;

