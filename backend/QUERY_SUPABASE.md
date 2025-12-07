# How to Query Supabase Database

## Quick SQL Queries (Supabase Dashboard)

Go to your Supabase dashboard → SQL Editor and run these queries:

### 1. Check All Hidden Gems in Western Cape

```sql
SELECT
  id,
  name,
  location,
  "waveType",
  difficulty,
  coordinates,
  "isHiddenGem"
FROM "Beach"
WHERE "regionId" = 'western-cape'
  AND "isHiddenGem" = true
ORDER BY name;
```

### 2. Count Hidden Gems by Region

```sql
SELECT
  r.name as region_name,
  COUNT(*) as hidden_gem_count
FROM "Beach" b
JOIN "Region" r ON b."regionId" = r.id
WHERE b."isHiddenGem" = true
GROUP BY r.name
ORDER BY hidden_gem_count DESC;
```

### 3. Check if Specific Beaches Exist

```sql
SELECT
  id,
  name,
  "isHiddenGem"
FROM "Beach"
WHERE id IN (
  'dungeons',
  'hout-bay-harbour-wedge',
  'brandfontein-private-nature-reserve',
  'hik-abalone-farm',
  'die-plaat',
  'i-and-js',
  'harold-porter'
)
ORDER BY id;
```

### 4. Find Missing Hidden Gems

```sql
-- This shows which expected hidden gems are NOT in the database
SELECT
  expected.id as expected_id,
  expected.name as expected_name,
  CASE
    WHEN b.id IS NULL THEN '❌ MISSING'
    ELSE '✅ EXISTS'
  END as status
FROM (
  VALUES
    ('dungeons', 'Dungeons 💀'),
    ('hout-bay-harbour-wedge', 'Hout Bay Harbour Wedge'),
    ('brandfontein-private-nature-reserve', 'Brandfontein Private Nature Reserve'),
    ('hik-abalone-farm', 'HIK Abalone Farm'),
    ('die-plaat', 'Die Plaat'),
    ('i-and-js', 'I&Js'),
    ('harold-porter', 'Harold Porter')
) AS expected(id, name)
LEFT JOIN "Beach" b ON b.id = expected.id
ORDER BY expected.id;
```

## Using Prisma Script (Local)

Run this script to query via Prisma:

```powershell
cd backend
npx tsx scripts/query-hidden-gems.ts
```

This will:

- Show all hidden gems currently in the database
- Compare with expected hidden gems from beachData.ts
- Show which ones are missing

## Push beachData.ts to Database

If beaches are missing, run the seed script:

```powershell
cd backend
npm run db:seed
```

This will sync all beaches from `backend/src/data/beachData.ts` to Supabase.

## Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Paste and run the SQL queries above

## Expected Hidden Gems (from beachData.ts)

For `western-cape` region:

1. ✅ Dungeons 💀 (already in DB)
2. ✅ Hout Bay Harbour Wedge (already in DB)
3. ❌ Brandfontein Private Nature Reserve (needs seeding)
4. ❌ HIK Abalone Farm (needs seeding)
5. ❌ Die Plaat (needs seeding)
6. ❌ I&Js (needs seeding)
7. ❌ Harold Porter (needs seeding)
