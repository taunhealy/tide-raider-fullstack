import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
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
            regionId: true,
            country: true,
            continent: true,
            region: {
              select: {
                id: true,
                name: true,
                country: true,
                continent: true,
              },
            },
          },
        },
        region: {
          select: {
            id: true,
            name: true,
            country: true,
            continent: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the expected Story type
    const formattedStories = stories.map((story) => ({
      ...story,
      beach: story.beach
        ? {
            id: story.beach.id,
            name: story.beach.name,
            region: story.beach.region?.name || story.region?.name || "",
            country: story.beach.country || story.region?.country || "",
            continent: story.beach.continent || story.region?.continent || "",
          }
        : undefined,
      date: story.date.toISOString(),
      createdAt: story.createdAt.toISOString(),
      updatedAt: story.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedStories);
  } catch (error) {
    console.error("Failed to fetch stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Add user existence check
  const author = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!author) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const date = formData.get("date") as string;
    const details = formData.get("details") as string;
    const category = formData.get("category") as string;
    const beach = formData.get("beach") as string;
    const isCustomBeach = formData.get("isCustomBeach") === "true";
    const link = formData.get("link") as string;

    // For non-custom beaches, ensure the beach exists in the database
    if (!isCustomBeach && beach !== "other") {
      const beachExists = await prisma.beach.findUnique({
        where: { id: beach },
      });

      if (!beachExists) {
        return NextResponse.json(
          { error: "Selected beach not found in database" },
          { status: 400 }
        );
      }
    }

    // Create the story with beach and region relations if beach is specified
    const storyData: any = {
      title,
      date: new Date(date),
      details,
      category,
      link: link || null,
      author: {
        connect: { id: author.id },
      },
    };

    if (!isCustomBeach && beach !== "other") {
      // Get beach data from database
      const beachData = await prisma.beach.findUnique({
        where: { id: beach },
        include: { region: true },
      });

      if (beachData) {
        storyData.beach = { connect: { id: beach } };
        if (beachData.regionId) {
          storyData.region = { connect: { id: beachData.regionId } };
        }
      }
    }

    const story = await prisma.story.create({
      data: storyData,
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
          include: {
            region: true,
          },
        },
        region: true,
      },
    });

    // Format the response to match the expected Story type
    const formattedStory = {
      ...story,
      beach: story.beach
        ? {
            id: story.beach.id,
            name: story.beach.name,
            region: story.beach.region?.name || story.region?.name || "",
            country: story.beach.region?.country || story.region?.country || "",
            continent:
              story.beach.region?.continent || story.region?.continent || "",
          }
        : undefined,
      date: story.date.toISOString(),
      createdAt: story.createdAt.toISOString(),
      updatedAt: story.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedStory);
  } catch (error) {
    console.error("Failed to create story:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}
