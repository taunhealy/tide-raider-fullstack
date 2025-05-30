import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Handle authenticated requests (own favorites)
  if (!userId && session?.user?.id) {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: session.user.id }, // All favorites for logged-in user
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(favorites);
  }

  // Handle public requests (other users' favorites)
  if (userId) {
    const favorites = await prisma.userFavorite.findMany({
      where: { userId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(favorites);
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, videoLink } = await req.json();

    const newFavorite = await prisma.userFavorite.create({
      data: {
        title,
        videoLink,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newFavorite);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Favorite ID required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const favorite = await prisma.userFavorite.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (favorite?.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this favorite" },
        { status: 403 }
      );
    }

    await prisma.userFavorite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete favorite" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...updateData } = await req.json();

    const favorite = await prisma.userFavorite.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!favorite || favorite.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedFavorite = await prisma.userFavorite.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedFavorite);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update favorite" },
      { status: 500 }
    );
  }
}
