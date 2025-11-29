-- Query 1: Check if isHiddenGem column exists and see all beaches with it set to true
SELECT id, name, "regionId", "isHiddenGem"
FROM "Beach"
WHERE "isHiddenGem" = true;

-- Query 2: Count beaches with isHiddenGem = true
SELECT COUNT(*) as hidden_gem_count
FROM "Beach"
WHERE "isHiddenGem" = true;

-- Query 3: Check specific beaches (Dungeons and Hout Bay Harbour Wedge)
SELECT id, name, "regionId", "isHiddenGem"
FROM "Beach"
WHERE id IN ('dungeons', 'hout-bay-harbour-wedge');

-- Query 4: See all beaches and their isHiddenGem status (first 20)
SELECT id, name, "regionId", "isHiddenGem"
FROM "Beach"
ORDER BY name
LIMIT 20;

-- Query 5: Check if the column exists at all
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Beach' AND column_name = 'isHiddenGem';

-- Query 6: Update specific beaches to have isHiddenGem = true (if needed)
-- UNCOMMENT BELOW TO RUN THE UPDATE:
-- UPDATE "Beach"
-- SET "isHiddenGem" = true
-- WHERE id IN ('dungeons', 'hout-bay-harbour-wedge');

-- Query 7: After update, verify the changes
-- SELECT id, name, "regionId", "isHiddenGem"
-- FROM "Beach"
-- WHERE id IN ('dungeons', 'hout-bay-harbour-wedge');
