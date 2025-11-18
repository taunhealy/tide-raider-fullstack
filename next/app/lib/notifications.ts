import { Forecast } from "@/app/types/forecast";
import { AlertType } from "@/app/types/alerts";

/**
 * @deprecated This function uses Prisma directly and should be migrated to backend API.
 * Alert processing is now handled by the backend at /api/alerts/notify
 */
export async function processUserAlerts(userId: string, today: Date) {
  console.warn(
    "processUserAlerts: This function should use backend API /api/alerts/notify"
  );
  return {
    alertsChecked: 0,
    notificationsSent: 0,
    errors: 0,
  };
}
