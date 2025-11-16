// app/api/sponsors/route.ts
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sponsors = await prisma.sponsorGlobal.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(sponsors);
  } catch (error) {
    // Database not accessible - return empty array
    console.error("[sponsors] Database error:", error);
    return NextResponse.json([]);
  }
}