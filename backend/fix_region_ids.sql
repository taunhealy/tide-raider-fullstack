
-- SQL Script to fix Region IDs in Supabase
-- Run this in the Supabase SQL Editor

BEGIN;

-- Function to migrate a region ID
CREATE OR REPLACE FUNCTION migrate_region_id(old_id TEXT, new_id TEXT) RETURNS void AS $$
DECLARE
    old_region_exists BOOLEAN;
    new_region_exists BOOLEAN;
BEGIN
    -- Check if old region exists
    SELECT EXISTS(SELECT 1 FROM "Region" WHERE id = old_id) INTO old_region_exists;
    
    IF NOT old_region_exists THEN
        RAISE NOTICE 'Region % does not exist. Skipping.', old_id;
        RETURN;
    END IF;

    -- Check if new region exists
    SELECT EXISTS(SELECT 1 FROM "Region" WHERE id = new_id) INTO new_region_exists;

    -- Create new region if it doesn't exist, copying data from old region
    IF NOT new_region_exists THEN
        INSERT INTO "Region" (id, name, "countryId", continent)
        SELECT new_id, name, "countryId", continent
        FROM "Region"
        WHERE id = old_id;
        RAISE NOTICE 'Created new region %', new_id;
    ELSE
        RAISE NOTICE 'Region % already exists.', new_id;
    END IF;

    -- Update foreign keys in all related tables
    
    UPDATE "Forecast" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated Forecasts';

    UPDATE "Beach" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated Beaches';

    UPDATE "Ad" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated Ads';

    UPDATE "AdRequest" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated AdRequests';

    UPDATE "Event" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated Events';

    UPDATE "Story" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated Stories';

    UPDATE "Alert" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated Alerts';

    UPDATE "BeachDailyScore" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated BeachDailyScores';

    UPDATE "LogEntry" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated LogEntries';

    UPDATE "UserSearch" SET "regionId" = new_id WHERE "regionId" = old_id;
    RAISE NOTICE 'Updated UserSearches';

    -- Delete the old region
    DELETE FROM "Region" WHERE id = old_id;
    RAISE NOTICE 'Deleted old region %', old_id;

END;
$$ LANGUAGE plpgsql;

-- Execute migrations for known incorrect IDs
SELECT migrate_region_id('Eastern Cape', 'eastern-cape');
SELECT migrate_region_id('Western Cape', 'western-cape');
SELECT migrate_region_id('KwaZulu-Natal', 'kwazulu-natal');
SELECT migrate_region_id('Northern Cape', 'northern-cape');

-- Clean up the function
DROP FUNCTION migrate_region_id(TEXT, TEXT);

COMMIT;
