import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        continentId: true,
        continent: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("API response - countries:", countries);

    return NextResponse.json(countries);
  } catch (error) {
    // Database not accessible - return empty array
    console.error("[location] Database error:", error);
    return NextResponse.json([]);
  }
}
