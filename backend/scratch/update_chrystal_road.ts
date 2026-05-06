import { prisma } from '../src/lib/prisma';

async function main() {
  const beachName = 'Chrystal Road';
  console.log(`Updating ${beachName}...`);

  const beach = await prisma.beach.findFirst({
    where: { name: beachName },
    include: { conditionProfiles: true }
  });

  if (!beach) {
    console.error('Beach not found');
    return;
  }

  // Update description
  await prisma.beach.update({
    where: { id: beach.id },
    data: {
      description: beach.description?.replace('SE or NW winds', 'N winds') || beach.description
    }
  });

  // Update GENERAL profile wind directions
  const generalProfile = beach.conditionProfiles.find(p => p.category === 'GENERAL');
  if (generalProfile) {
    await prisma.beachConditionProfile.update({
      where: { id: generalProfile.id },
      data: {
        optimalWindDirections: ['N', 'NW', 'NE', 'NNE', 'NNW']
      }
    });
    console.log('Updated GENERAL profile optimal wind directions to N, NW, NE, NNE, NNW');
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
