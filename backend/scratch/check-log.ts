import { prisma } from "../src/lib/prisma";

async function checkLog() {
  const id = "68561cf3-0e31-4252-a3c2-bc04ab70230c";
  console.log(`Checking log entry: ${id}`);

  const entry = await prisma.logEntry.findUnique({
    where: { id },
    include: {
      beach: true,
      region: true
    }
  });

  if (!entry) {
    console.log("Log entry not found");
    return;
  }

  console.log("Entry found:");
  console.log(JSON.stringify({
    id: entry.id,
    beachName: entry.beachName,
    beachId: entry.beachId,
    beach: entry.beach ? {
      id: entry.beach.id,
      name: entry.beach.name,
      isHiddenGem: entry.beach.isHiddenGem
    } : null
  }, null, 2));
}

checkLog().catch(console.error);
