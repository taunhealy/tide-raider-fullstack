
import "../setup";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkLog() {
  const log = await prisma.logEntry.findUnique({
    where: { id: "2a1f27f4-4291-4ab1-a566-9ca57edc05a5" },
    include: { beach: true }
  });
  console.log(JSON.stringify(log, null, 2));
  process.exit(0);
}

checkLog();
