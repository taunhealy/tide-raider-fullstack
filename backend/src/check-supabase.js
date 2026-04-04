const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = 'https://pffssccmdbopnlgjdhwh.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('Checking regions via Supabase API...');
  
  const { data: regions, error: regionsError } = await supabase
    .from('Region')
    .select('*, country:Country(*)');

  if (regionsError) {
    console.error('Error fetching regions:', regionsError);
  } else {
    console.log(`Found ${regions.length} regions.`);
    const bali = regions.find(r => r.id.toLowerCase() === 'bali' || r.name.toLowerCase().includes('bali'));
    if (bali) {
      console.log('✅ Bali region found:', bali);
    } else {
      console.log('❌ Bali region NOT found.');
    }
    
    // Check some sample regions
    console.log('Sample regions:', regions.slice(0, 5).map(r => r.name));
  }

  console.log('\nChecking beaches with regionId = bali...');
  const { data: beaches, error: beachesError } = await supabase
    .from('Beach')
    .select('name, regionId')
    .eq('regionId', 'bali');

  if (beachesError) {
    console.error('Error fetching beaches:', beachesError);
  } else {
    console.log(`Found ${beaches.length} beaches in Bali.`);
    beaches.forEach(b => console.log(`- ${b.name}`));
  }
}

checkData();
