import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { UserRole } from "@prisma/client";
import { ROLE_OPTIONS } from "@/app/lib/users/constants";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    // Verify authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify ownership
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { roles } = await request.json();
    const rolesToUpdate = Array.isArray(roles) ? roles : [];

    console.log("Updating roles for user:", userId);
    console.log("New roles:", rolesToUpdate);

    // Validate that all provided roles are valid UserRole enum values
    const validRoles = ROLE_OPTIONS.map((option) => option.value);
    const areRolesValid = rolesToUpdate.every((role: string) =>
      validRoles.includes(role)
    );

    if (!areRolesValid) {
      return NextResponse.json(
        { error: "Invalid roles provided" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roles: rolesToUpdate },
      select: {
        id: true,
        roles: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user roles:", error);
    return NextResponse.json(
      { error: "Failed to update roles" },
      { status: 500 }
    );
  }
}
