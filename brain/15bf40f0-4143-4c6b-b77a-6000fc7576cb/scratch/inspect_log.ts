import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = '68b11f6c-2a7e-4475-be0e-3c50cdbc775b';
  const entry = await prisma.logEntry.findUnique({
    where: { id },
    include: {
      beach: true,
      region: true,
      user: true,
    }
  });

  console.log(JSON.stringify(entry, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
