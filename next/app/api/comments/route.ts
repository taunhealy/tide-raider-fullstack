import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";

// GET /api/comments?entityId=xxx&entityType=xxx
// Note: This endpoint requires DATABASE_URL.
// TODO: Implement backend endpoint for comments or add DATABASE_URL to Next.js environment
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");
  const entityType = searchParams.get("entityType");

  if (!entityId || !entityType) {
    return NextResponse.json(
      { error: "Missing entityId or entityType" },
      { status: 400 }
    );
  }

  // Return empty array for now to prevent errors
  // Comments functionality requires DATABASE_URL or backend endpoint
  return NextResponse.json([]);

  /* Original Prisma code (requires DATABASE_URL):
  try {
    const comments = await prisma.comment.findMany({
      where: {
        entityId,
        entityType,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
  */
}

// POST /api/comments
// Note: This endpoint requires DATABASE_URL.
// TODO: Implement backend endpoint for comments or add DATABASE_URL to Next.js environment
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text, entityId, entityType } = await request.json();

    if (!text || !entityId || !entityType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Return error - comments require DATABASE_URL or backend endpoint
    return NextResponse.json(
      {
        error: "Comments feature temporarily unavailable",
        message: "DATABASE_URL required or backend endpoint needed",
      },
      { status: 501 }
    );

    /* Original Prisma code (requires DATABASE_URL):
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        entityId,
        entityType,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
    */
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
