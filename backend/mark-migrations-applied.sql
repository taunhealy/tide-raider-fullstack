-- Mark all Prisma migrations as applied
-- Run this in Supabase SQL Editor after manually running combined-migrations.sql

-- Create _prisma_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP,
    "started_at" TIMESTAMP NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Mark all migrations as applied (using UUIDs for IDs)
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
VALUES
    (gen_random_uuid()::text, 'placeholder_checksum_1', now(), '20250702195919_init', now(), 1),
    (gen_random_uuid()::text, 'placeholder_checksum_2', now(), '20251115102954_add_star_rating_to_beach_daily_score', now(), 1),
    (gen_random_uuid()::text, 'placeholder_checksum_3', now(), '20251118190000_refactor_to_single_forecast_model', now(), 1),
    (gen_random_uuid()::text, 'placeholder_checksum_4', now(), '20251119131830_add_windy_source', now(), 1),
    (gen_random_uuid()::text, 'placeholder_checksum_5', now(), '20251119131843_add_windy_source', now(), 1),
    (gen_random_uuid()::text, 'placeholder_checksum_6', now(), '20251121110113_add_image_urls_field', now(), 1)
ON CONFLICT ("id") DO NOTHING;

-- Verify migrations are marked
SELECT "migration_name", "finished_at" FROM "_prisma_migrations" ORDER BY "started_at";

