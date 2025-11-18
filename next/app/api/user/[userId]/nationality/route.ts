import { NextResponse } from "next/server";
import { backendPut } from "@/app/lib/backend-api";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { nationality } = await req.json();

    const updatedUser = await backendPut(`/api/users/${userId}/nationality`, {
      nationality,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating nationality:", error);
    return NextResponse.json(
      { error: "Failed to update nationality" },
      { status: 500 }
    );
  }
}
