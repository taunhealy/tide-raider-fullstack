import { NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const entries = await backendGet(`/api/raid-logs/user/${userId}`);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
