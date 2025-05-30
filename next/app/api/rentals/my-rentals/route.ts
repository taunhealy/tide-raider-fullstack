import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's rental items
    const rentalItems = await prisma.rentalItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        availableBeaches: {
          include: {
            beach: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        rentalRequests: {
          where: {
            status: "PENDING",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(rentalItems);
  } catch (error) {
    console.error("Error fetching user rentals:", error);
    return NextResponse.json(
      { error: "Failed to fetch rental items" },
      { status: 500 }
    );
  }
}
