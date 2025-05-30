import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        startTime: {
          gte: new Date(),
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "title",
      "description",
      "country",
      "region",
      "startTime",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate date
    const startTime = new Date(body.startTime);

    if (isNaN(startTime.getTime())) {
      console.error("Invalid startTime format");
      return NextResponse.json(
        { error: "Invalid startTime format" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        country: body.country,
        regionId: body.region,
        region: {
          connect: { id: body.region },
        },
        startTime,
        link: body.link || null,
        user: {
          connect: { id: body.userId },
        },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
