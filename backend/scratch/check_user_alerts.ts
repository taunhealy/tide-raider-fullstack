
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userEmail = 'taunhealy@gmail.com';
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return;

  console.log(`--- Alerts for ${userEmail} ---`);
  const alerts = await prisma.alert.findMany({
    where: { userId: user.id },
    include: { logEntry: true }
  });

  alerts.forEach(a => {
    console.log(`Alert: ${a.name} (${a.id})`);
    console.log(`  Type: ${a.alertType}`);
    console.log(`  Active: ${a.active}`);
    console.log(`  Forecast Date: ${a.forecastDate?.toISOString()}`);
    console.log(`  Log Entry Date: ${a.logEntry?.date?.toISOString()}`);
    console.log('---');
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
