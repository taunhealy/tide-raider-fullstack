import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";

// GET User Profile (Public)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    // Add validation for userId format
    if (!userId || !/^[a-z0-9]+$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    console.log("API Request for user ID:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        bio: true,
        link: true,
        image: true,
        createdAt: true,
        skillLevel: true,
        nationality: true,
        _count: {
          select: {
            boards: true,
            stories: true,
            favorites: true,
          },
        },
      },
    });

    console.log("User lookup result:", user ? "Found" : "Not found");

    if (!user) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in user API route:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// UPDATE User Profile (Authenticated)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);

  // Verify authentication
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Verify ownership
  if (session.user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { bio, name, link } = await request.json();

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio: bio?.trim(),
        name: name?.trim(),
        link: link?.trim(),
      },
      select: {
        id: true,
        name: true,
        bio: true,
        link: true,
        image: true,
        email: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
