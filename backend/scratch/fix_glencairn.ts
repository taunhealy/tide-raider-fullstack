
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update the forecast for the Glencairn log
  const forecastId = 'dfce5415-7c5d-49c3-b202-0d7b0fe57b02';
  
  const updatedForecast = await prisma.forecast.update({
    where: { id: forecastId },
    data: {
      swellDirection: 189
    }
  });

  console.log('✅ Updated Forecast:', updatedForecast);

  // Ensure Glencairn beach is marked as hidden gem (it was already, but just to be safe)
  const updatedBeach = await prisma.beach.update({
    where: { id: 'glencairn' },
    data: {
      isHiddenGem: true
    }
  });

  console.log('✅ Updated Beach:', updatedBeach.name, 'isHiddenGem:', updatedBeach.isHiddenGem);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
