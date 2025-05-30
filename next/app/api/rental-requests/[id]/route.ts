import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const request = await prisma.rentalItemRequest.findUnique({
      where: { id: params.id },
      include: {
        rentalItem: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
        renter: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Rental request not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this request
    if (
      request.renterId !== session.user.id &&
      request.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("Error fetching rental request:", error);
    return NextResponse.json(
      { error: "Failed to fetch rental request" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();

    // Get the current request
    const request = await prisma.rentalItemRequest.findUnique({
      where: { id: params.id },
      include: {
        rentalItem: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Rental request not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this request
    const isOwner = request.ownerId === session.user.id;
    const isRenter = request.renterId === session.user.id;

    if (!isOwner && !isRenter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate status transitions
    if (request.status === "COMPLETED" || request.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot update a completed or cancelled request" },
        { status: 400 }
      );
    }

    // Only owner can approve/reject
    if ((status === "APPROVED" || status === "REJECTED") && !isOwner) {
      return NextResponse.json(
        { error: "Only the owner can approve or reject requests" },
        { status: 403 }
      );
    }

    // Only renter can cancel
    if (status === "CANCELLED" && !isRenter) {
      return NextResponse.json(
        { error: "Only the renter can cancel requests" },
        { status: 403 }
      );
    }

    // Update the request
    const updatedRequest = await prisma.rentalItemRequest.update({
      where: { id: params.id },
      data: { status },
    });

    // If approved, create availability record to block these dates
    if (status === "APPROVED") {
      await prisma.rentalItemAvailability.create({
        data: {
          rentalItemId: request.rentalItemId,
          startDate: request.startDate,
          endDate: request.endDate,
        },
      });
    }

    // If cancelled or rejected, remove any availability record
    if (status === "CANCELLED" || status === "REJECTED") {
      await prisma.rentalItemAvailability.deleteMany({
        where: {
          rentalItemId: request.rentalItemId,
          startDate: request.startDate,
          endDate: request.endDate,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating rental request:", error);
    return NextResponse.json(
      { error: "Failed to update rental request" },
      { status: 500 }
    );
  }
}
