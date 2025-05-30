import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filters = await req.json();

    // Get user ID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save or update filters for the user
    await prisma.userFilters.upsert({
      where: {
        userId: user.id,
      },
      update: {
        filters: filters,
      },
      create: {
        userId: user.id,
        userEmail: session.user.email,
        filters: filters,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving filters:", error);
    return NextResponse.json(
      { error: "Failed to save filters" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userFilters = await prisma.userFilters.findUnique({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json(userFilters?.filters || null);
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
