// app/api/beaches/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");

  if (!regionId) {
    return NextResponse.json(
      { error: "Region ID is required" },
      { status: 400 }
    );
  }

  try {
    const beaches = await prisma.beach.findMany({
      where: {
        regionId: regionId,
      },
      include: {
        region: true,
      },
    });

    return NextResponse.json(beaches);
  } catch (error) {
    console.error("Failed to fetch beaches:", error);
    return NextResponse.json(
      { error: "Failed to fetch beaches" },
      { status: 500 }
    );
  }
}
