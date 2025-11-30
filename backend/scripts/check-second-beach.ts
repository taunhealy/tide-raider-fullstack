import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT id, name, "regionId"
      FROM "Beach"
      WHERE name LIKE '%Second Beach%'
    `;

    console.log("Beaches matching 'Second Beach':");
    console.table(result);
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
