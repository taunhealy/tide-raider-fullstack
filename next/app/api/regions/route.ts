import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  try {
    if (name) {
      // Find region by name
      const regions = await prisma.region.findMany({
        where: {
          name: {
            equals: name,
            mode: "insensitive", // Case-insensitive search
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      return NextResponse.json(regions);
    } else {
      // Get all regions
      const regions = await prisma.region.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      });

      return NextResponse.json(regions);
    }
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}
