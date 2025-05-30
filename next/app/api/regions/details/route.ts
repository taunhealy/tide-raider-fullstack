import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const regionName = searchParams.get("region");

    if (!regionName) {
      return NextResponse.json(
        { error: "Region parameter is required" },
        { status: 400 }
      );
    }

    // Find the region by name
    const region = await prisma.region.findFirst({
      where: {
        name: regionName,
      },
      select: {
        id: true,
        name: true,
        country: true,
        continent: true,
      },
    });

    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    return NextResponse.json(region);
  } catch (error) {
    console.error("Error fetching region details:", error);
    return NextResponse.json(
      { error: "Failed to fetch region details" },
      { status: 500 }
    );
  }
}
