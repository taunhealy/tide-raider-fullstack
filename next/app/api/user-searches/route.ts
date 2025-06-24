import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const { regionId } = await request.json();
    const session = await getServerSession(authOptions);

    const search = await prisma.userSearch.create({
      data: {
        regionId,
        userId: session?.user?.id, // Will be null for non-authenticated users
      },
      include: {
        region: true,
      },
    });

    return NextResponse.json(search);
  } catch (error) {
    console.error("Error tracking search:", error);
    return NextResponse.json(
      { error: "Failed to track search" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    // Get recent searches, either for the user or globally
    const searches = await prisma.userSearch.findMany({
      where: session?.user?.id ? { userId: session.user.id } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      distinct: ["regionId"], // Avoid duplicates
      include: {
        region: true,
      },
    });

    return NextResponse.json(searches);
  } catch (error) {
    console.error("Error fetching searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch searches" },
      { status: 500 }
    );
  }
}
