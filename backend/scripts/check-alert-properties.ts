import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAlertProperties() {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: "fdac771f-66d9-4674-91c9-b128e5495312" },
      select: {
        properties: true,
        alertType: true,
        sources: true,
        logEntryId: true,
      },
    });

    if (!alert) {
      console.log("Alert not found");
      return;
    }

    console.log("Alert Properties:", JSON.stringify(alert.properties, null, 2));
    console.log("Sources:", alert.sources);
    console.log("Alert Type:", alert.alertType);
    console.log("Log Entry ID:", alert.logEntryId);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlertProperties();

