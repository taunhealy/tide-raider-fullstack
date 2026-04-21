import { prisma } from "../src/lib/prisma";
import { sendAlertNotification } from "../src/services/notificationService";

async function main() {
  const alertId = "f38cb5b6-3b17-4c8e-9cb5-5db4c805aa5d";
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      properties: true,
      region: true,
      user: true,
    }
  });

  if (!alert) {
    console.error("Alert not found");
    return;
  }

  const mockMatch = {
    alertId: alert.id,
    alertName: alert.name,
    region: alert.regionId,
    timestamp: new Date(),
    matchedProperties: [
      {
        property: "swellHeight",
        logValue: 2.5,
        forecastValue: 2.5,
        difference: 0,
        withinRange: true,
      }
    ],
    matchDetails: "FORCED TEST ALERT - Tide Raider Intelligence",
  };

  console.log(`🚀 Firing test alert for: ${alert.name} (${alert.notificationMethod})`);
  
  // Clear today's notifications to bypass the 'already sent' check
  const { AlertService } = await import("../src/services/alertService");
  await AlertService.deleteTodayNotifications(alertId);
  
  const success = await sendAlertNotification(mockMatch as any, alert as any, "Witsands");
  
  if (success) {
    console.log("✅ TEST ALERT SENT SUCCESSFULLY");
  } else {
    console.log("❌ TEST ALERT FAILED - Check logs/Resend/Evolution API");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
