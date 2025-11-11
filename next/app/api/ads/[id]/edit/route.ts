import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        region: true,
        beachConnections: {
          include: {
            beach: true,
          },
        },
      },
    });

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    if (ad.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Transform the data to include region and beaches
    const responseData = {
      ...ad,
      region: ad.region.name,
      beaches: ad.beachConnections.map((bc) => ({
        id: bc.beachId,
        name: bc.beach.name,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching ad:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Verify ownership
    const existingAd = await prisma.ad.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        beachConnections: true,
      },
    });

    if (!existingAd) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    if (existingAd.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create an update object with explicit typing
    const updateData: {
      title: string;
      companyName: string;
      linkUrl: string;
      category: string;
      regionId: string;
      categoryType: string;
      imageUrl: string | null | undefined;
      description?: string;
    } = {
      title: data.title,
      companyName: data.companyName,
      linkUrl: data.linkUrl,
      category:
        typeof data.category === "string"
          ? data.category.toLowerCase().replace(/_/g, "-")
          : data.category,
      regionId: data.regionId,
      categoryType: data.categoryType,
      imageUrl: data.imageUrl, // Always include imageUrl in the update
    };

    // Add description if it exists in the data
    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    console.log("Final category being saved:", updateData.category);

    console.log("Update data being sent to Prisma:", updateData);

    // First, update the ad details
    const updatedAd = await prisma.ad.update({
      where: { id },
      data: updateData,
    });

    // Then, handle beach connections if targetedBeaches is provided
    if (data.targetedBeaches && Array.isArray(data.targetedBeaches)) {
      console.log("Updating targeted beaches:", data.targetedBeaches);

      // Delete existing beach connections
      await prisma.adBeachConnection.deleteMany({
        where: { adId: id },
      });

      // Create new beach connection - only use the first beach in the array
      if (data.targetedBeaches.length > 0) {
        // Only create a connection for the first beach in the array
        const targetBeachId = data.targetedBeaches[0];

        await prisma.adBeachConnection.create({
          data: {
            adId: id,
            beachId: targetBeachId,
          },
        });

        console.log(
          `Created single beach connection for beach ID: ${targetBeachId}`
        );
      }
    }

    // Fetch the updated ad with beach connections
    const finalAd = await prisma.ad.findUnique({
      where: { id },
      include: {
        beachConnections: {
          include: {
            beach: true,
          },
        },
      },
    });

    return NextResponse.json(finalAd);
  } catch (error) {
    console.error("Error updating ad:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageUrl } = await request.json();
    console.log("Received image update request:", {
      adId: id,
      imageUrl,
    });

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingAd = await prisma.ad.findUnique({
      where: { id },
      select: { id: true, userId: true, imageUrl: true },
    });

    if (!existingAd) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    if (existingAd.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update only the image URL
    const updatedAd = await prisma.ad.update({
      where: { id },
      data: { imageUrl },
    });

    console.log("Updated image URL:", updatedAd.imageUrl);

    return NextResponse.json({ success: true, imageUrl: updatedAd.imageUrl });
  } catch (error) {
    console.error("Error updating image URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
