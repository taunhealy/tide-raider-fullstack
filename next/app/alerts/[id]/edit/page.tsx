import { redirect } from "next/navigation";
import { EditAlertPageClient } from "./EditAlertPageClient";
import { Prisma, AlertType } from "@prisma/client";
import { getServerAuth } from "@/app/lib/server-auth";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

async function getAlert(
  id: string,
  userId: string
): Promise<Prisma.AlertCreateInput | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Fetch alert from backend API
    const response = await fetch(`${BACKEND_URL}/api/alerts/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch alert: ${response.statusText}`);
    }

    const alert = await response.json();

    if (!alert || alert.userId !== userId) {
      // User can only access their own alerts
      return null;
    }

    // Transform backend alert format to Prisma AlertCreateInput format (same as create form)
    return {
      id: alert.id,
      name: alert.name,
      notificationMethod: alert.notificationMethod,
      contactInfo: alert.contactInfo || "",
      active: alert.active,
      alertType: alert.alertType as AlertType,
      starRating: alert.starRating,
      forecastDate: alert.forecastDate,
      region: {
        connect: { id: alert.regionId },
      },
      user: {
        connect: { id: alert.userId },
      },
      properties: {
        create: (alert.properties || []).map((prop: any) => ({
          property: prop.property,
          optimalValue: prop.optimalValue,
          range: prop.range,
        })),
      },
      ...(alert.logEntryId && {
        logEntry: {
          connect: { id: alert.logEntryId },
        },
      }),
      ...(alert.beachId && {
        beach: {
          connect: { id: alert.beachId },
        },
      }),
      ...(alert.forecastId && {
        forecast: {
          connect: { id: alert.forecastId },
        },
      }),
    };
  } catch (error) {
    console.error("Error fetching alert:", error);
    return null;
  }
}

export default async function EditAlertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await getServerAuth();

  if (!user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const alert = await getAlert(id, user.id);

  // If alert not found, redirect to alerts page
  if (!alert) {
    redirect("/alerts");
  }

  // Fetch log entries for the edit form from backend API
  let logEntries: any[] = [];
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    const logsResponse = await fetch(`${BACKEND_URL}/api/logs`, {
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (logsResponse.ok) {
      logEntries = await logsResponse.json();
      // Limit to most recent 100 entries
      logEntries = logEntries.slice(0, 100);
    } else {
      console.error("Failed to fetch log entries:", logsResponse.statusText);
      logEntries = [];
    }
  } catch (error) {
    console.error("Error fetching log entries:", error);
    logEntries = [];
  }

  return <EditAlertPageClient alert={alert} logEntries={logEntries} />;
}
