import { prisma } from "@/app/lib/prisma";
import { sendRequestExpiredNotification } from "@/app/lib/email";
import { RequestStatus } from "@prisma/client";

// Define the missing type
interface CreateRentalRequestData {
  rentalItemId: string;
  renterId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  beachId: string;
  totalCost: any; // This could be more specific
}

export async function handleRequestExpiration() {
  const EXPIRATION_HOURS = 48;

  try {
    // Find expired requests
    const expiredRequests = await prisma.rentalItemRequest.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: new Date(Date.now() - EXPIRATION_HOURS * 60 * 60 * 1000),
        },
        isExpired: false, // Only process non-expired requests
      },
      include: {
        renter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        rentalItem: {
          select: {
            id: true,
            name: true,
            itemType: true,
          },
        },
      },
    });

    // Update requests in bulk
    if (expiredRequests.length > 0) {
      await prisma.rentalItemRequest.updateMany({
        where: {
          id: {
            in: expiredRequests.map((req) => req.id),
          },
        },
        data: {
          status: "EXPIRED" as RequestStatus,
          isExpired: true,
        },
      });

      // Send notifications
      await Promise.all(
        expiredRequests.map((request) =>
          sendRequestExpiredNotification(request)
        )
      );
    }

    return expiredRequests.length;
  } catch (error) {
    console.error("Failed to handle request expiration:", error);
    throw error;
  }
}

// Add other request-related utility functions here
export async function createRentalRequest(data: CreateRentalRequestData) {
  return prisma.rentalItemRequest.create({
    data: {
      ...data,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      status: "PENDING" as RequestStatus,
    },
  });
}

export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  reason?: string
) {
  return prisma.rentalItemRequest.update({
    where: { id: requestId },
    data: {
      status,
      lastActionAt: new Date(),
      cancellationReason: reason,
    },
  });
}
