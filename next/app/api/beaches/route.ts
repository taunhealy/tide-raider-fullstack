import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const regionId = url.searchParams.get("regionId");

  try {
    let beaches;

    if (regionId) {
      // If regionId is provided, filter beaches by region
      beaches = await prisma.beach.findMany({
        where: {
          regionId: regionId,
        },
        include: {
          region: true,
        },
      });
    } else {
      // If no regionId, return all beaches
      beaches = await prisma.beach.findMany({
        include: {
          region: true,
        },
      });
    }

    // Format the response to include region information
    const formattedBeaches = beaches.map((beach) => ({
      id: beach.id,
      name: beach.name,
      regionId: beach.regionId,
      region: beach.region?.name || "",
      country: beach.region?.country || beach.country || "",
      continent: beach.region?.continent || beach.continent || "",
    }));

    return NextResponse.json(formattedBeaches);
  } catch (error) {
    console.error("Error fetching beaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch beaches" },
      { status: 500 }
    );
  }
}
