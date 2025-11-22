-- Check forecast data for Bali region
-- This query shows all forecast data stored in the database for Bali

-- 1. Check all forecast data for 'bali' region, grouped by source
SELECT 
  f.date,
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection",
  f."regionId"
FROM "Forecast" f
WHERE f."regionId" = 'bali'
ORDER BY f.date DESC, f.source;

-- 2. Count forecasts by source for 'bali'
SELECT 
  f.source,
  COUNT(*) AS forecast_count,
  MIN(f.date) AS earliest_date,
  MAX(f.date) AS latest_date
FROM "Forecast" f
WHERE f."regionId" = 'bali'
GROUP BY f.source
ORDER BY f.source;

-- 3. Check forecasts for today's date (2025-11-22) for 'bali' by source
SELECT 
  f.date,
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection"
FROM "Forecast" f
WHERE f."regionId" = 'bali' 
  AND f.date = '2025-11-22'::date
ORDER BY f.source;

-- 4. Check forecasts for the last 7 days for 'bali', grouped by source
SELECT 
  f.date,
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection"
FROM "Forecast" f
WHERE f."regionId" = 'bali' 
  AND f.date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY f.date DESC, f.source;

-- 5. Check if WINDGURU (scraperB) has any data for Bali
SELECT 
  f.date,
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection"
FROM "Forecast" f
WHERE f."regionId" = 'bali'
  AND f.source = 'WINDGURU'
ORDER BY f.date DESC
LIMIT 10;

-- 6. Check all available sources for Bali today
SELECT 
  f.source,
  f.date,
  f."windSpeed",
  f."windDirection",
  f."swellHeight"
FROM "Forecast" f
WHERE f."regionId" = 'bali'
  AND f.date >= CURRENT_DATE
ORDER BY f.date, f.source;

