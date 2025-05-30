import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { beachData } from "@/app/types/beaches";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const details = formData.get("details") as string;
    const category = formData.get("category") as string;
    const beach = formData.get("beach") as string;
    const isCustomBeach = formData.get("isCustomBeach") === "true";
    const link = formData.get("link") as string;

    // Verify the story exists and belongs to the user
    const existingStory = await prisma.story.findUnique({
      where: { id: params.id },
      include: { author: true },
    });

    if (!existingStory) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (existingStory.author.email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the story
    const updatedStory = await prisma.story.update({
      where: { id: params.id },
      data: {
        title,
        date: new Date(date),
        details,
        category,
        link: link || null,
        beachName: isCustomBeach
          ? beach
          : beachData.find((b) => b.id === beach)?.name || "",
        ...(isCustomBeach || beach === "other"
          ? { beach: { disconnect: true } }
          : { beach: { connect: { id: beach } } }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        beach: true,
      },
    });

    return NextResponse.json(updatedStory);
  } catch (error) {
    console.error("Failed to update story:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update story",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the story exists and belongs to the user
    const story = await prisma.story.findUnique({
      where: { id: params.id },
      include: { author: true },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    if (story.author.email !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the story
    await prisma.story.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Failed to delete story:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userStories = await prisma.story.findMany({
      where: {
        authorId: params.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        beach: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(userStories);
  } catch (error) {
    console.error("Failed to fetch user stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stories" },
      { status: 500 }
    );
  }
}
