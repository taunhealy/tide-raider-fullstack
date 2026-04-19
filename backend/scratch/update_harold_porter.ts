import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const id = "harold-porter";
  const b = await prisma.beach.update({
    where: { id },
    data: {
      coordinates: {
        lat: -34.3593611,
        lng: 18.9267222
      }
    }
  });
  console.log('Successfully updated Harold Porter:', b.name, b.coordinates);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
