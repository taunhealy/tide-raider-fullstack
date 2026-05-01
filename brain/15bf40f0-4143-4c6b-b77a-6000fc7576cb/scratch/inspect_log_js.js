
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = "68b11f6c-2a7e-4475-be0e-3c50cdbc775b";
  try {
    const entry = await prisma.logEntry.findUnique({
      where: { id },
    });
    console.log(JSON.stringify(entry, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
