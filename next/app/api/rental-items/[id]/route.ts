import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { beachData } from "@/app/types/beaches"; // Import beachData

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rentalItem = await prisma.rentalItem.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        availableBeaches: {
          include: {
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
          },
        },
      },
    });

    if (!rentalItem) {
      return NextResponse.json(
        { error: "Rental item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rentalItem);
  } catch (error) {
    console.error("Error fetching rental item:", error);
    return NextResponse.json(
      { error: "Failed to fetch rental item" },
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

    const {
      name,
      description,
      rentPrice,
      images,
      thumbnail,
      itemType,
      specifications,
      availableBeaches,
    } = await req.json();

    // Get the rental item to check ownership
    const rentalItem = await prisma.rentalItem.findUnique({
      where: { id: params.id },
    });

    if (!rentalItem) {
      return NextResponse.json(
        { error: "Rental item not found" },
        { status: 404 }
      );
    }

    if (rentalItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own rental items" },
        { status: 403 }
      );
    }

    // Extract just the beach IDs from the availableBeaches array and ensure they're unique
    const beachIds = [
      ...new Set(
        availableBeaches.map((beach: any) =>
          typeof beach === "string" ? beach : beach.id
        )
      ),
    ] as string[];

    // Check which beaches exist in the database
    const existingBeaches = await prisma.beach.findMany({
      where: {
        id: {
          in: beachIds,
        },
      },
      select: {
        id: true,
      },
    });

    const existingBeachIds = existingBeaches.map((beach) => beach.id);
    const missingBeachIds = beachIds.filter(
      (id) => !existingBeachIds.includes(id)
    );

    // Only upsert beaches that don't exist yet
    for (const beachId of missingBeachIds) {
      const beachInfo = beachData.find((b) => b.id === beachId);

      if (beachInfo) {
        // Check if region exists
        const existingRegion = await prisma.region.findUnique({
          where: { id: beachInfo.region },
        });

        // Upsert the region if it doesn't exist
        if (!existingRegion) {
          await prisma.region.create({
            data: {
              id: beachInfo.region,
              name: beachInfo.region,
              country: beachInfo.country,
              continent: beachInfo.continent || null,
            },
          });
        }

        // Create the beach
        await prisma.beach.create({
          data: {
            id: beachInfo.id,
            name: beachInfo.name,
            location: beachInfo.location,
            country: beachInfo.country,
            regionId: beachInfo.region,
            continent: beachInfo.continent || "",
            distanceFromCT: beachInfo.distanceFromCT || 0,
            optimalWindDirections: beachInfo.optimalWindDirections || [],
            optimalSwellDirections: beachInfo.optimalSwellDirections || {},
            bestSeasons: beachInfo.bestSeasons || [],
            optimalTide: beachInfo.optimalTide || "",
            description: beachInfo.description || "",
            difficulty: beachInfo.difficulty || "",
            waveType: beachInfo.waveType || "",
            swellSize: beachInfo.swellSize || {},
            idealSwellPeriod: beachInfo.idealSwellPeriod || {},
            waterTemp: beachInfo.waterTemp || {},
            hazards: beachInfo.hazards || [],
            crimeLevel: beachInfo.crimeLevel || "",
            sharkAttack: beachInfo.sharkAttack
              ? JSON.parse(JSON.stringify(beachInfo.sharkAttack))
              : {},
            coordinates: beachInfo.coordinates || {},
            image: beachInfo.image,
            profileImage: beachInfo.profileImage,
            videos: beachInfo.videos,
          },
        });
      }
    }

    // Update the rental item with a transaction to handle the beach connections
    const updatedRentalItem = await prisma.$transaction(async (tx) => {
      // First delete all existing beach connections
      await tx.beachRentalConnection.deleteMany({
        where: { rentalItemId: params.id },
      });

      // Then update the rental item
      const updated = await tx.rentalItem.update({
        where: { id: params.id },
        data: {
          name,
          description,
          rentPrice,
          images: Array.isArray(images) ? images : [],
          thumbnail,
          itemType,
          specifications,
          isActive: true,
        },
        include: {
          availableBeaches: {
            include: {
              beach: true,
            },
          },
        },
      });

      // Create beach connections separately to avoid unique constraint issues
      for (const beachId of beachIds) {
        await tx.beachRentalConnection.create({
          data: {
            rentalItemId: params.id,
            beachId: beachId,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedRentalItem);
  } catch (error) {
    console.error("Error updating rental item:", error);
    return NextResponse.json(
      { error: "Failed to update rental item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingItem = await prisma.rentalItem.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found or you do not have permission to delete it" },
        { status: 404 }
      );
    }

    // First, delete all rental requests for this item
    await prisma.rentalItemRequest.deleteMany({
      where: {
        rentalItemId: params.id,
      },
    });

    // Then delete the rental item
    await prisma.rentalItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rental item:", error);
    return NextResponse.json(
      { error: "Failed to delete rental item" },
      { status: 500 }
    );
  }
}
