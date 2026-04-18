import { NextResponse } from "next/server";
import { backendGet } from "@/app/lib/backend-api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Proxy to backend: http://localhost:4001/api/intelligence/report?...
    // Increased timeout to 30s for AI generation
    const result = await backendGet(`/api/intelligence/report?${queryString}`, { timeout: 30000 });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch AI intelligence report:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI intelligence report" },
      { status: 500 }
    );
  }
}
