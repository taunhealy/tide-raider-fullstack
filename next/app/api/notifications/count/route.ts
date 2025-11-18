import { NextRequest, NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET(req: NextRequest) {
  try {
    const result = await backendGet("/api/notifications/count");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification count" },
      { status: 500 }
    );
  }
}
