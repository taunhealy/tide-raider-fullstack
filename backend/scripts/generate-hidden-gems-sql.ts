import { beachData } from '../src/data/beachData';

console.log('Finding hidden gems in beachData.ts...');

const hiddenGems = beachData.filter(beach => beach.isHiddenGem === true);

console.log(`Found ${hiddenGems.length} hidden gems:`);
hiddenGems.forEach(beach => {
  console.log(`- ${beach.name} (ID: ${beach.id})`);
});

// Generate SQL update statement
const ids = hiddenGems.map(beach => `'${beach.id}'`).join(', ');
const sql = `
-- Update all hidden gems found in beachData.ts
UPDATE "Beach"
SET "isHiddenGem" = true
WHERE id IN (${ids});

-- Verify the update
SELECT id, name, "isHiddenGem"
FROM "Beach"
WHERE "isHiddenGem" = true;
`;

console.log('\nGenerated SQL:');
console.log(sql);
