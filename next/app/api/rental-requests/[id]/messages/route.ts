import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();

    // Get the request to verify user is involved
    const request = await prisma.rentalItemRequest.findUnique({
      where: { id: params.id },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Rental request not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to send messages
    if (
      request.renterId !== session.user.id &&
      request.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create the message
    const message = await prisma.rentalChatMessage.create({
      data: {
        requestId: params.id,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update the request's updatedAt timestamp
    await prisma.rentalItemRequest.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
