import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeContinents() {
  console.log('Merging Continents...');
  const pairs = [
    { from: 'Africa', to: 'AF' },
    { from: 'Europe', to: 'EU' },
    { from: 'Asia', to: 'AS' },
    { from: 'North America', to: 'NA' },
    { from: 'South America', to: 'SA' },
    { from: 'Oceania', to: 'OC' },
  ];

  for (const pair of pairs) {
    console.log(`Checking continent ${pair.from} -> ${pair.to}`);
    // Check if both exist
    const fromCont = await (prisma.continent as any).findUnique({ where: { id: pair.from } });
    const toCont = await (prisma.continent as any).findUnique({ where: { id: pair.to } });

    if (fromCont && toCont) {
      console.log(`Merging ${pair.from} into ${pair.to}`);
      // Update countries to point to the new continent
      await prisma.country.updateMany({
        where: { continentId: pair.from },
        data: { continentId: pair.to }
      });
      // Delete the old continent
      await (prisma.continent as any).delete({ where: { id: pair.from } });
    } else if (fromCont && !toCont) {
      console.log(`Renaming continent ${pair.from} to ${pair.to}`);
      // This is harder because ID is the primary key. We'll create and delete.
      await (prisma.continent as any).create({
        data: { id: pair.to, name: fromCont.name }
      });
      await prisma.country.updateMany({
        where: { continentId: pair.from },
        data: { continentId: pair.to }
      });
      await (prisma.continent as any).delete({ where: { id: pair.from } });
    }
  }
}

async function mergeCountries() {
  console.log('Merging Countries...');
  const pairs = [
    { from: 'south-africa', to: 'za' },
    { from: 'namibia', to: 'na' },
    { from: 'gabon', to: 'ga' },
    { from: 'liberia', to: 'lr' },
    { from: 'senegal', to: 'sn' },
    { from: 'mayotte', to: 'yt' },
    { from: 'faroe-islands', to: 'fo' },
    { from: 'morocco', to: 'ma' },
    { from: 'angola', to: 'ao' },
    { from: 'mozambique', to: 'mz' },
    { from: 'united-kingdom', to: 'gb' },
    { from: 'el-salvador', to: 'sv' },
    { from: 'peru', to: 'pe' },
    { from: 'chile', to: 'cl' },
    { from: 'nicaragua', to: 'ni' },
    { from: 'panama', to: 'pa' },
    { from: 'philippines', to: 'ph' },
    { from: 'sri-lanka', to: 'lk' },
    { from: 'australia', to: 'au' },
    { from: 'indonesia', to: 'id' },
    { from: 'united-states', to: 'us' },
    { from: 'france', to: 'fr' },
    { from: 'spain', to: 'es' },
    { from: 'brazil', to: 'br' },
    { from: 'costa-rica', to: 'cr' },
    { from: 'mexico', to: 'mx' },
    { from: 'new-zealand', to: 'nz' },
    { from: 'japan', to: 'jp' },
    { from: 'fiji', to: 'fj' },
    { from: 'maldives', to: 'mv' },
    { from: 'taiwan', to: 'tw' },
    { from: 'thailand', to: 'th' },
    { from: 'ireland', to: 'ie' },
    { from: 'canary-islands', to: 'es-cn' },
    { from: 'hawaii', to: 'us-hi' },
    { from: 'ecuador', to: 'ec' },
    { from: 'madagascar', to: 'mg' },
    { from: 'samoa', to: 'ws' },
    { from: 'tahiti', to: 'pf' },
  ];

  for (const pair of pairs) {
    const fromCountry = await prisma.country.findUnique({ where: { id: pair.from } });
    const toCountry = await prisma.country.findUnique({ where: { id: pair.to } });

    if (fromCountry && toCountry) {
      console.log(`Merging country ${pair.from} into ${pair.to}`);
      // Update beaches
      await prisma.beach.updateMany({
        where: { countryId: pair.from },
        data: { countryId: pair.to }
      });
      // Update regions
      await prisma.region.updateMany({
        where: { countryId: pair.from },
        data: { countryId: pair.to }
      });
      // Update hidden gems
      await prisma.hiddenGem.updateMany({
        where: { countryId: pair.from },
        data: { countryId: pair.to }
      });
      // Delete old country
      await prisma.country.delete({ where: { id: pair.from } });
    }
  }
}

async function main() {
  await mergeContinents();
  await mergeCountries();
  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
