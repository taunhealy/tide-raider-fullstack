import { NextResponse } from "next/server";
import { backendPut } from "@/app/lib/backend-api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { roles } = await request.json();

    const updatedUser = await backendPut(`/api/users/${userId}/roles`, {
      roles,
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
