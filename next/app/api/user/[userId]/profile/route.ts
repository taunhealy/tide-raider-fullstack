import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const profile = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        image: true,
        nationality: true,
        link: true,
      },
    });

    if (!profile) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
