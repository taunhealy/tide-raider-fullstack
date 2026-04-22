import { NextResponse } from "next/server";
import { backendPost } from "@/app/lib/backend-api";

/**
 * POST /api/intelligence/weekly
 * Proxy to backend POST /api/intelligence/weekly
 * Strategic AI reports are heavy, so we allow a longer timeout (30s)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Proxy to backend with auth passed through
    const result = await backendPost("/api/intelligence/weekly", body);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[intelligence/weekly] Proxy error:", error);
    
    // Pass through status codes if we can identify them
    if (error.message.includes("status 402")) {
        return NextResponse.json({ error: "Insufficient credits", message: "You need at least 2 credits." }, { status: 402 });
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to generate weekly tactical intelligence" },
      { status: 500 }
    );
  }
}
