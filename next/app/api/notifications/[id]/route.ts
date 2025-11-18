import { NextRequest, NextResponse } from "next/server";
import { backendDelete } from "@/app/lib/backend-api";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await backendDelete(`/api/notifications/${id}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
