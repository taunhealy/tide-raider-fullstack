import { NextResponse } from "next/server";
import { backendPost } from "@/app/lib/backend-api";

/**
 * POST /api/intelligence/share-email
 * Proxy to backend POST /api/intelligence/share-email
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Proxy to backend with auth passed through
    const result = await backendPost("/api/intelligence/share-email", body);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[intelligence/share-email] Proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to share intelligence report via email" },
      { status: 500 }
    );
  }
}
