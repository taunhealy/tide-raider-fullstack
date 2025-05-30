import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const beachId = url.searchParams.get("beachId");
  const regionId = url.searchParams.get("regionId");
  const normalizedRegionId = regionId
    ? regionId.toLowerCase().replace(/ /g, "-")
    : null;
  const type = url.searchParams.get("type") || null; // Make type optional

  try {
    // Build the query
    const query: any = {
      where: {
        status: "active",
      },
      include: {
        _count: {
          select: {
            clicks: true,
          },
        },
        beachConnections: true, // Include beach connections
      },
    };

    // Add categoryType filter only if type is provided
    if (type) {
      query.where.categoryType = type;
    }

    // Add beach filter if provided
    if (beachId) {
      query.where.beachConnections = {
        some: {
          beachId: beachId,
        },
      };
    }

    // Add region filter if provided
    if (normalizedRegionId) {
      query.where.regionId = normalizedRegionId;
    }

    const ads = await prisma.ad.findMany(query);

    if (ads.length > 0) {
      // Access beachConnections safely with optional chaining
      const connections = (ads[0] as any).beachConnections;
      if (connections) {
      }
    }

    return NextResponse.json({ ads });
  } catch (error) {
    console.error("Error fetching ads:", error);
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Add category transformation here
    const category =
      typeof data.category === "string"
        ? data.category.toLowerCase().replace(/_/g, "-")
        : data.category;

    const {
      title,
      companyName,
      contactEmail,
      linkUrl,
      description,
      // Use the transformed category
      customCategory,
      regionId,
      targetedBeaches,
      yearlyPrice,
      imageUrl,
    } = data;

    // Create ad request and ad together in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the ad request
      const adRequest = await prisma.adRequest.create({
        data: {
          id: `req_${Date.now()}`,
          companyName,
          title: companyName,
          contactEmail: session.user.email || "",
          linkUrl: linkUrl,
          description,
          // Use the transformed category
          category,
          categoryType: data.categoryType || "local",
          customCategory,
          regionId,
          yearlyPrice,
          status: "PENDING",
          userId: session.user.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          googleAdsContribution: 0,
          categoryData: {
            location: [regionId],
          },
          imageUrl: imageUrl || null, // Ensure imageUrl is saved
        },
      });

      // Create the ad with beach connections
      const ad = await prisma.ad.create({
        data: {
          requestId: adRequest.id,
          companyName,
          title,
          description,
          // Use the transformed category
          category,
          categoryType: data.categoryType || "local",
          customCategory,
          linkUrl,
          imageUrl: imageUrl || null, // Ensure imageUrl is saved
          regionId,
          status: "pending",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userId: session.user.id,
          beachConnections: {
            create: targetedBeaches.map((beachId: string) => ({
              beachId,
            })),
          },
        },
      });

      return { adRequest, ad };
    });

    return NextResponse.json({
      success: true,
      adId: result.ad.id,
      requestId: result.adRequest.id,
    });
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create ad",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Ad ID is required" }, { status: 400 });
  }

  try {
    const { status } = await request.json();

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { adRequest: true },
    });

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    if (ad.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update ad status
    const updatedAd = await prisma.ad.update({
      where: { id },
      data: {
        status,
        ...(status === "cancelled" ? { endDate: new Date() } : {}),
      },
    });

    // Update ad request status if it exists
    if (ad.adRequest) {
      await prisma.adRequest.update({
        where: { id: ad.adRequest.id },
        data: {
          status: status === "cancelled" ? "CANCELLED" : status.toUpperCase(),
        },
      });
    }

    return NextResponse.json(updatedAd);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "Ad ID is required" }, { status: 400 });
  }

  try {
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { adRequest: true, beachConnections: true },
    });

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    if (ad.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete in a transaction to ensure all related records are deleted
    await prisma.$transaction(async (prisma) => {
      // Delete beach connections first
      await prisma.adBeachConnection.deleteMany({
        where: { adId: id },
      });

      // Delete the ad
      await prisma.ad.delete({
        where: { id },
      });

      // Delete the ad request if it exists
      if (ad.adRequest) {
        await prisma.adRequest.delete({
          where: { id: ad.adRequest.id },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete ad" }, { status: 500 });
  }
}
