import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4050";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/sponsors
 * Proxy to backend /api/sponsors (if exists) or return empty array
 * Note: Backend endpoint may not exist yet, so we return empty array as fallback
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Try to fetch from backend, but return empty array if endpoint doesn't exist
    try {
      const response = await fetch(`${BACKEND_URL}/api/sponsors`, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (error) {
      // Backend endpoint might not exist yet - return empty array
      console.log("[sponsors] Backend endpoint not available, returning empty array");
    }

    // Fallback: return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("[sponsors] Error:", error);
    return NextResponse.json([]);
  }
}
