import { NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query string from all search params
    const queryString = searchParams.toString();
    const url = queryString 
      ? `/api/filtered-beaches?${queryString}`
      : "/api/filtered-beaches";
    
    const result = await backendGet(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to filter beaches:", error);
    return NextResponse.json(
      { error: "Failed to filter beaches" },
      { status: 500 }
    );
  }
}
