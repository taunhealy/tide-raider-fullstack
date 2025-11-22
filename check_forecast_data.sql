-- Check if forecast data exists for Bali region
-- Run this in Supabase SQL Editor

-- 1. Check all forecasts for Bali region
SELECT 
  f.id,
  f.date,
  f."regionId",
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection",
  r.name as region_name
FROM "Forecast" f
JOIN "Region" r ON f."regionId" = r.id
WHERE r.id = 'bali' OR r.name ILIKE '%bali%'
ORDER BY f.date DESC, f.source;

-- 2. Count forecasts by source for Bali
SELECT 
  f.source,
  COUNT(*) as count,
  MAX(f.date) as latest_date
FROM "Forecast" f
JOIN "Region" r ON f."regionId" = r.id
WHERE r.id = 'bali' OR r.name ILIKE '%bali%'
GROUP BY f.source;

-- 3. Check today's forecasts for Bali (all sources)
SELECT 
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection",
  f.date
FROM "Forecast" f
JOIN "Region" r ON f."regionId" = r.id
WHERE (r.id = 'bali' OR r.name ILIKE '%bali%')
  AND f.date = CURRENT_DATE
ORDER BY f.source;

-- 4. Check recent forecasts (last 7 days) for Bali
SELECT 
  f.date,
  f.source,
  f."windSpeed",
  f."windDirection",
  f."swellHeight",
  f."swellPeriod",
  f."swellDirection"
FROM "Forecast" f
JOIN "Region" r ON f."regionId" = r.id
WHERE (r.id = 'bali' OR r.name ILIKE '%bali%')
  AND f.date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY f.date DESC, f.source;
