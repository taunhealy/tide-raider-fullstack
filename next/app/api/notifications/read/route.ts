import { NextResponse } from "next/server";
import { backendPost } from "@/app/lib/backend-api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "Invalid notification IDs" },
        { status: 400 }
      );
    }

    const result = await backendPost("/api/notifications/read", {
      notificationIds,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
