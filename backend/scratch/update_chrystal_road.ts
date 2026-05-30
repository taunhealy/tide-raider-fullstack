import { prisma } from '../src/lib/prisma';

async function main() {
  const beachName = 'Crystal Road';
  console.log(`Updating ${beachName}...`);

  let beach = await prisma.beach.findFirst({
    where: { name: beachName },
    include: { conditionProfiles: true }
  });

  if (!beach) {
    console.log('Crystal Road not found, trying Chrystal Road...');
    beach = await prisma.beach.findFirst({
      where: { name: 'Chrystal Road' },
      include: { conditionProfiles: true }
    });
  }

  if (!beach) {
    console.error('Beach not found');
    return;
  }

  // Update description
  await prisma.beach.update({
    where: { id: beach.id },
    data: {
      description: "Crystal Road is a consistent right-hand break with a mix of sand and rocks. It offers rides under 50m and works best on medium to high tides with N or NW winds. Watch out for rips and rocks."
    }
  });
  console.log('Updated beach description');

  // Update GENERAL profile wind directions
  const generalProfile = beach.conditionProfiles.find(p => p.category === 'GENERAL');
  if (generalProfile) {
    await prisma.beachConditionProfile.update({
      where: { id: generalProfile.id },
      data: {
        optimalWindDirections: ['N', 'NW']
      }
    });
    console.log('Updated GENERAL profile optimal wind directions to N, NW');
  }

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
