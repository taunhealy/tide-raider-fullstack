import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { authOptions } from "@/app/lib/authOptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { name } = await req.json();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Name cannot be empty" },
      { status: 400 }
    );
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name: name.trim() },
    });

    // Update the session name with proper null handling
    if (session.user) {
      session.user.name = updatedUser.name ?? undefined;
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}
