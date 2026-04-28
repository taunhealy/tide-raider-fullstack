import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.logEntry.findMany({
    where: {
      OR: [
        { beachName: { contains: "Glencairn", mode: "insensitive" } },
        { beach: { name: { contains: "Glencairn", mode: "insensitive" } } }
      ]
    },
    include: {
      beach: true
    }
  });

  console.log(`Found ${logs.length} Glencairn logs:`);
  logs.forEach(log => {
    console.log(`ID: ${log.id}`);
    console.log(`BeachName: ${log.beachName}`);
    console.log(`BeachObj: ${log.beach ? JSON.stringify(log.beach) : 'null'}`);
    console.log(`HiddenGem: ${log.beach?.isHiddenGem}`);
    console.log(`-------------------`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
