import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nationality } = await req.json();

    // Add logging to debug
    console.log("Updating nationality:", {
      userId: params.userId,
      nationality,
    });

    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { nationality },
    });

    // Add logging to confirm update
    console.log("Updated user:", updatedUser);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating nationality:", error);
    return NextResponse.json(
      { error: "Failed to update nationality" },
      { status: 500 }
    );
  }
}
