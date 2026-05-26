import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.logEntry.findMany({
    where: {
      OR: [
        { beachName: { contains: "Hidden", mode: "insensitive" } },
        { beachName: { contains: "Gem", mode: "insensitive" } }
      ]
    }
  });
  console.log(`Found ${logs.length} logs with 'Hidden' or 'Gem' in beachName:`);
  logs.forEach(l => {
    console.log(`- ID: ${l.id}, Date: ${l.date}, beachName: ${l.beachName}, beachId: ${l.beachId}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
