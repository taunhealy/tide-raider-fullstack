import { NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Always include isHiddenGem=true for this endpoint
    const params = new URLSearchParams(searchParams);
    params.set("isHiddenGem", "true");
    
    const queryString = params.toString();
    const url = `/api/filtered-beaches?${queryString}`;
    
    const result = await backendGet(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch hidden gems:", error);
    return NextResponse.json(
      { error: "Failed to fetch hidden gems" },
      { status: 500 }
    );
  }
}
