import { NextResponse } from "next/server";
import { backendGet, backendPut } from "@/app/lib/backend-api";

// GET User Profile (Public)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    // Add validation for userId format
    if (!userId || !/^[a-z0-9]+$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const user = await backendGet(`/api/users/${userId}`);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in user API route:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// UPDATE User Profile (Authenticated)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    const updatedUser = await backendPut(`/api/users/${userId}`, body);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
