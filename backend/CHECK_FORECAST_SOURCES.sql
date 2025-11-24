-- Check what forecast sources exist in your database
SELECT 
    source,
    COUNT(*) as forecast_count,
    COUNT(DISTINCT "regionId") as regions_covered,
    MAX(date) as latest_date
FROM "Forecast"
GROUP BY source
ORDER BY source;

-- Check specifically for Western Cape
SELECT 
    source,
    date,
    "windSpeed",
    "swellHeight"
FROM "Forecast"
WHERE "regionId" = 'western-cape'
ORDER BY date DESC, source
LIMIT 20;

