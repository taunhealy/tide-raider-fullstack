import { NextRequest, NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const notifications = await backendGet("/api/notifications");
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
