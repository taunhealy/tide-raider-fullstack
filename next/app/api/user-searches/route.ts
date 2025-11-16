import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";

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
    // Database not accessible - silently fail (search tracking is not critical)
    console.error("[user-searches] Database error (POST):", error);
    return NextResponse.json({ success: false }, { status: 200 });
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
    // Database not accessible - return empty array
    console.error("[user-searches] Database error:", error);
    return NextResponse.json([]);
  }
}
