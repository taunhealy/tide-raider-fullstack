import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const logId = "b5438909-67bf-41cb-b231-33400c369fff";
  const raidLog = await prisma.logEntry.findUnique({
    where: { id: logId },
    select: {
        id: true,
        forecastId: true,
        forecast: true
    }
  });

  console.log(`Log ID: ${raidLog?.id}`);
  console.log(`Forecast ID: ${raidLog?.forecastId}`);
  console.log(`Forecast: ${JSON.stringify(raidLog?.forecast)}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
