import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { updateRequestStatus } from "@/app/lib/rentalRequests";
import { RequestStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestId = params.id;
    const { status } = await req.json();

    // Fetch the current request to check permissions
    const currentRequest = await prisma.rentalItemRequest.findUnique({
      where: { id: requestId },
      select: {
        ownerId: true,
        renterId: true,
        rentalItemId: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (!currentRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const userId = session.user.id;

    // Check permissions based on the action
    if (
      (status === "ACCEPTED" || status === "DECLINED") &&
      userId !== currentRequest.ownerId
    ) {
      return NextResponse.json(
        { error: "Only the owner can accept or decline requests" },
        { status: 403 }
      );
    }

    if (status === "CANCELLED" && userId !== currentRequest.renterId) {
      return NextResponse.json(
        { error: "Only the renter can cancel requests" },
        { status: 403 }
      );
    }

    // Update the request status
    const updatedRequest = await updateRequestStatus(
      requestId,
      status as RequestStatus
    );

    // If request is accepted, create board availability record
    if (status === "ACCEPTED") {
      await prisma.rentalItemAvailability.create({
        data: {
          rentalItemId: currentRequest.rentalItemId,
          startDate: currentRequest.startDate,
          endDate: currentRequest.endDate,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating rental request status:", error);
    return NextResponse.json(
      { error: "Failed to update request status" },
      { status: 500 }
    );
  }
}
