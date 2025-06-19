import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

// GET - Fetch a specific alert with its log entry
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching alert with ID:", params.id);
    const alert = await prisma.alert.findUnique({
      where: {
        id: params.id,
      },
      include: {
        properties: true,
        logEntry: {
          include: {
            forecast: true,
            beach: true,
          },
        },
        beach: true,
        region: true,
      },
    });

    console.log("Found alert:", alert); // Debug log
    return NextResponse.json(alert);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch alert" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing alert
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const dateOnly = new Date(data.forecastDate).toISOString().split("T")[0];

    // Remove fields that shouldn't be directly updated
    const {
      logEntry,
      logEntryId,
      forecast,
      forecastId,
      id,
      userId,
      ...updateData
    } = data;

    const alert = await prisma.alert.update({
      where: { id: params.id },
      data: {
        ...updateData,
        forecastDate: new Date(dateOnly),
        ...(logEntryId && {
          logEntry: {
            connect: { id: logEntryId },
          },
        }),
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

// Schema for alert update validation
const AlertUpdateSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().min(1).optional(),
  regionId: z.string().min(1).optional(),
  properties: z
    .array(
      z.object({
        property: z.enum([
          "windSpeed",
          "windDirection",
          "swellHeight",
          "swellPeriod",
          "swellDirection",
        ]),
        optimalValue: z.number(),
        range: z.number().min(0),
        sourceType: z.enum(["beach_optimal", "log_entry", "custom"]).optional(),
        sourceId: z.string().optional(),
      })
    )
    .optional(),
  notificationMethod: z.enum(["email", "whatsapp", "app", "both"]).optional(),
  contactInfo: z.string().min(1).optional(),
  forecastDate: z.date().optional(),
  alertType: z.enum(["VARIABLES", "RATING"]).optional(),
  starRating: z.number().min(1).max(5).nullable().optional(),
  beachId: z.string().optional(),
});

// DELETE - Delete an alert
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;

    // Verify alert ownership
    const alert = await prisma.alert.findUnique({
      where: {
        id: alertId,
        userId: session.user.id,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete related AlertNotification records first
    await prisma.alertNotification.deleteMany({
      where: {
        alertId: alertId,
      },
    });

    // Delete related AlertCheck records
    await prisma.alertCheck.deleteMany({
      where: {
        alertId: alertId,
      },
    });

    // Delete related AlertProperty records
    await prisma.alertProperty.deleteMany({
      where: {
        alertId: alertId,
      },
    });

    // Now delete the alert
    await prisma.alert.delete({
      where: {
        id: alertId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}

// PATCH - Update an alert
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = params.id;
    const data = await req.json();

    // Validate request body
    const validationResult = AlertUpdateSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid alert data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // First verify alert exists and belongs to user
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: session.user.id,
      },
      include: {
        properties: true,
      },
    });

    if (!existingAlert) {
      return NextResponse.json(
        { error: "Alert not found or unauthorized" },
        { status: 404 }
      );
    }

    // Use transaction to ensure data consistency
    const updatedAlert = await prisma.$transaction(async (tx) => {
      // Update properties if provided
      if (data.properties) {
        // Delete existing properties
        await tx.alertProperty.deleteMany({
          where: { alertId },
        });

        // Create new properties with source tracking
        await tx.alertProperty.createMany({
          data: data.properties.map((prop: any) => ({
            alertId,
            property: prop.property,
            optimalValue: prop.optimalValue,
            range: prop.range,
            sourceType: prop.sourceType || "custom",
            sourceId: prop.sourceId,
          })),
        });
      }

      // Update alert with new data
      return tx.alert.update({
        where: { id: alertId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.regionId && { regionId: data.regionId }),
          ...(data.active !== undefined && { active: data.active }),
          ...(data.notificationMethod && {
            notificationMethod: data.notificationMethod,
          }),
          ...(data.contactInfo && { contactInfo: data.contactInfo }),
          ...(data.beachId && { beachId: data.beachId }),
          ...(data.alertType && { alertType: data.alertType }),
          ...(data.starRating !== undefined && { starRating: data.starRating }),
          ...(data.forecastDate && {
            forecastDate: new Date(data.forecastDate),
          }),
        },
        include: {
          properties: true,
          logEntry: {
            include: {
              forecast: true,
              beach: true,
            },
          },
          beach: true,
          region: true,
        },
      });
    });

    // Reset alert checks since conditions changed
    await prisma.alertCheck.deleteMany({
      where: { alertId },
    });

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}
