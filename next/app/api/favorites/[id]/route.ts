import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const favorite = await prisma.userFavorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (favorite.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, videoLink } = await req.json();

    // First verify the favorite exists and belongs to user
    const existingFavorite = await prisma.userFavorite.findUnique({
      where: { id },
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { error: "Favorite not found" },
        { status: 404 }
      );
    }

    if (existingFavorite.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Now perform the update
    const updatedFavorite = await prisma.userFavorite.update({
      where: { id },
      data: {
        title,
        videoLink,
      },
    });

    return NextResponse.json(updatedFavorite);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update favorite" },
      { status: 500 }
    );
  }
}
