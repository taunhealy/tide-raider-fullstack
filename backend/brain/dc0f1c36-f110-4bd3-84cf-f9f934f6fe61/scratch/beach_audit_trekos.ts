import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkBeaches() {
  const beaches = await prisma.beach.findMany({
    where: {
      id: { contains: "trekos" }
    }
  });

  console.log("--- TREKOS DATA AUDIT ---");
  beaches.forEach(beach => {
    console.log(`\nBeach: ${beach.name} (${beach.id})`);
    console.log(`Optimal Wind: ${beach.optimalWindDirections}`);
    console.log(`Optimal Swell (Range): ${JSON.stringify(beach.optimalSwellDirections)}`);
    console.log(`Ideal Swell Size (Range): ${JSON.stringify(beach.swellSize)}`);
    console.log(`Ideal Period (Range): ${JSON.stringify(beach.idealSwellPeriod)}`);
    console.log(`Sheltered: ${beach.sheltered}`);
  });
}

checkBeaches()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
