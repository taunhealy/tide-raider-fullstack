import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { sendRentalRequestEmail } from "@/app/lib/email";
import type { Session } from "next-auth";
import { RentalRequestWithRelations } from "@/app/types/rentals";

// Helper function to check rental item availability
async function checkRentalItemAvailability(
  rentalItemId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  // Check if there are any overlapping rental requests
  const existingRequests = await prisma.rentalItemRequest.findMany({
    where: {
      rentalItemId: rentalItemId,
      status: { in: ["PENDING", "APPROVED"] },
      OR: [
        {
          // Request starts during existing rental
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
  });

  return existingRequests.length === 0;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "all"; // 'all', 'renter', 'owner'
    const status = searchParams.get("status"); // Optional filter by status

    // Build the where clause
    let where: any = {};

    if (type === "renter") {
      where.renterId = session.user.id;
    } else if (type === "owner") {
      where.ownerId = session.user.id;
    } else {
      // 'all' - show both renter and owner requests
      where.OR = [{ renterId: session.user.id }, { ownerId: session.user.id }];
    }

    if (status) {
      where.status = status;
    }

    const requests = await prisma.rentalItemRequest.findMany({
      where,
      include: {
        rentalItem: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            itemType: true,
          },
        },
        renter: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        beach: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching rental requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch rental requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rentalItemId, startDate, endDate, beachId, totalCost } =
      await req.json();

    // Get the rental item to verify it exists and get owner ID
    const rentalItem = await prisma.rentalItem.findUnique({
      where: { id: rentalItemId },
      select: { userId: true, isActive: true },
    });

    if (!rentalItem) {
      return NextResponse.json(
        { error: "Rental item not found" },
        { status: 404 }
      );
    }

    if (!rentalItem.isActive) {
      return NextResponse.json(
        { error: "This item is not available for rent" },
        { status: 400 }
      );
    }

    // Prevent renting your own item
    if (rentalItem.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot rent your own item" },
        { status: 400 }
      );
    }

    // Check if the beach is available for this rental item
    const beachConnection = await prisma.beachRentalConnection.findFirst({
      where: {
        rentalItemId,
        beachId,
      },
    });

    if (!beachConnection) {
      return NextResponse.json(
        { error: "This item is not available at the selected location" },
        { status: 400 }
      );
    }

    // Check if the item is available for the requested dates
    // First, check if there's an availability record that covers the entire requested period
    const availabilityExists = await prisma.rentalItemAvailability.findFirst({
      where: {
        rentalItemId,
        startDate: { lte: new Date(startDate) },
        endDate: { gte: new Date(endDate) },
      },
    });

    if (!availabilityExists) {
      return NextResponse.json(
        { error: "This item is not available for the selected dates" },
        { status: 400 }
      );
    }

    // Then check if there are any overlapping approved or pending rental requests
    const isAvailable = await checkRentalItemAvailability(
      rentalItemId,
      new Date(startDate),
      new Date(endDate)
    );

    if (!isAvailable) {
      return NextResponse.json(
        { error: "This item is already booked for the selected dates" },
        { status: 400 }
      );
    }

    // Create the rental request
    const rentalRequest = (await prisma.rentalItemRequest.create({
      data: {
        rentalItemId,
        renterId: session.user.id,
        ownerId: rentalItem.userId,
        status: "PENDING",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        beachId,
        totalCost,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default expiry 7 days from now
        lastActionAt: new Date(),
        modificationCount: 0,
      },
      include: {
        renter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        rentalItem: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            itemType: true,
          },
        },
        beach: {
          select: {
            id: true,
            name: true,
            region: {
              select: {
                name: true,
              },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })) as unknown as RentalRequestWithRelations;

    try {
      // Send email notification with error handling
      await sendRentalRequestEmail(rentalRequest as any);
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Continue with the request even if email fails
    }

    return NextResponse.json(rentalRequest);
  } catch (error) {
    console.error("Error creating rental request:", error);
    return NextResponse.json(
      { error: "Failed to create rental request" },
      { status: 500 }
    );
  }
}
