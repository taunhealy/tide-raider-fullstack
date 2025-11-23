-- Check forecast data for Eastern Cape region
-- Run this in Supabase SQL Editor to verify data exists

-- 1. Check all forecast data for 'eastern-cape' region, grouped by source
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
WHERE f."regionId" = 'eastern-cape'
ORDER BY f.date DESC, f.source;

-- 2. If no results, try finding the region by name
SELECT 
  r.id,
  r.name
FROM "Region" r
WHERE r.name ILIKE '%eastern%cape%' OR r.id ILIKE '%eastern%cape%'
ORDER BY r.name;

-- 3. Check forecasts for eastern-cape (confirmed region ID)
SELECT 
  f.date,
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection"
FROM "Forecast" f
WHERE f."regionId" = 'eastern-cape'
ORDER BY f.date DESC, f.source;

-- 4. Check if WINDGURU has any data for Eastern Cape (any date)
SELECT 
  f.date,
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection"
FROM "Forecast" f
WHERE f."regionId" = 'eastern-cape'
  AND f.source = 'WINDGURU'
ORDER BY f.date DESC
LIMIT 10;

-- 5. Check all available sources for Eastern Cape (any date)
SELECT 
  f.source,
  COUNT(*) AS forecast_count,
  MIN(f.date) AS earliest_date,
  MAX(f.date) AS latest_date
FROM "Forecast" f
WHERE f."regionId" = 'eastern-cape'
GROUP BY f.source
ORDER BY f.source;

-- 6. Check forecasts for 2025-11-23 for Eastern Cape by source
SELECT 
  f.date,
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection"
FROM "Forecast" f
WHERE f."regionId" = 'eastern-cape'
  AND f.date = '2025-11-23'::date
ORDER BY f.source;

