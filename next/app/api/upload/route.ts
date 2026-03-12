import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG } from "@/app/lib/api-config";

/**
 * API Upload Proxy
 * Restored to fix "api upload error" in client.
 * Forwards upload requests to the backend which handles large files and R2 storage.
 */

const BACKEND_URL = API_CONFIG.baseUrl;

export const runtime = "nodejs"; // Required for streaming bodies

export async function POST(req: NextRequest) {
  try {
    const backendUrl = `${BACKEND_URL}/api/upload`;
    console.log(`[upload-proxy] Forwarding upload to: ${backendUrl}`);

    // Get auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Prepare headers - MUST include Content-Type with boundary for multipart/form-data
    const headers = new Headers();
    const contentType = req.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }
    
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }

    // Forward cookies
    headers.set("Cookie", cookieStore.toString());

    // Forward the request to the backend
    // Use req.blob() or req.arrayBuffer() if req.body (stream) has issues in some environments
    // But for Node.js runtime, req.body should work.
    const body = await req.arrayBuffer();

    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[upload-proxy] Backend error ${response.status}:`, data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[upload-proxy] Error:", error);
    return NextResponse.json(
      { error: "Upload proxy error", message: error.message },
      { status: 500 }
    );
  }
}
