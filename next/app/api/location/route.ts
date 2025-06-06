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
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries", details: String(error) },
      { status: 500 }
    );
  }
}
