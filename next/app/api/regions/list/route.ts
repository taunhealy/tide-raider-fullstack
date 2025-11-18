import { NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET() {
  try {
    const regions = await backendGet("/api/regions");
    return NextResponse.json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}
