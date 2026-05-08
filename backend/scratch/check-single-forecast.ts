import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const forecast = await prisma.forecast.findFirst({
    where: {
      source: "WINDY",
      date: new Date("2026-05-07T00:00:00Z"),
      timeSlot: "EVENING"
    }
  });

  console.log("FORECAST:", JSON.stringify(forecast, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
