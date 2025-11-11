import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nationality } = await req.json();

    // Add logging to debug
    console.log("Updating nationality:", {
      userId,
      nationality,
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
