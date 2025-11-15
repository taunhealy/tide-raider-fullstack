import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { EditAlertPageClient } from "./EditAlertPageClient";
import { Prisma, AlertType } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getAlert(
  id: string,
  userId: string
): Promise<Prisma.AlertCreateInput | null> {
  try {
    const alert = await prisma.alert.findUnique({
      where: {
        id,
        userId, // Ensure user can only access their own alerts
      },
      include: {
        properties: true,
        logEntry: {
          include: {
            forecast: true,
            beach: true,
            region: true,
          },
        },
        beach: true,
        region: true,
        forecast: true,
      },
    });

    if (!alert) {
      return null;
    }

    // Transform to Prisma AlertCreateInput format (same as create form)
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
        create: alert.properties.map((prop) => ({
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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const alert = await getAlert(id, session.user.id);

  // If alert not found, redirect to alerts page
  if (!alert) {
    redirect("/alerts");
  }

  // Fetch log entries for the edit form
  const logEntries = await prisma.logEntry.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      beach: {
        include: {
          region: {
            include: {
              country: true,
            },
          },
        },
      },
      region: {
        include: {
          country: true,
        },
      },
      forecast: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 100, // Limit to most recent 100 entries
  });

  return <EditAlertPageClient alert={alert} logEntries={logEntries} />;
}
