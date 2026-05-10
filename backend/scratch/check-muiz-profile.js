const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMuizenbergProfile() {
  try {
    const beach = await prisma.beach.findFirst({
      where: { name: { contains: 'Muizenberg' } },
      include: { conditionProfiles: true }
    });

    if (!beach) {
      console.log("Muizenberg Beach not found.");
      return;
    }

    console.log("Beach:", beach.name, "ID:", beach.id);
    console.log("Profiles:");
    console.log(JSON.stringify(beach.conditionProfiles, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMuizenbergProfile();
