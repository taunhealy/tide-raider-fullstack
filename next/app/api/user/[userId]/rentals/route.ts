import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { RentalItemType } from "@/app/types/rentals";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    // Fetch the user's rental items
    const rentalItems = await prisma.rentalItem.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        itemType: true,
        specifications: true,
        thumbnail: true,
        images: true,
        rentPrice: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        availableBeaches: {
          select: {
            id: true,
            rentalItemId: true,
            beachId: true,
            beach: {
              select: {
                id: true,
                name: true,
                region: {
                  select: {
                    id: true,
                    name: true,
                    continent: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(rentalItems);
  } catch (error) {
    console.error("Error fetching user rental items:", error);
    return NextResponse.json(
      { error: "Failed to fetch user rental items" },
      { status: 500 }
    );
  }
}
