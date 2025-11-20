import { NextRequest, NextResponse } from "next/server";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4001";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/user/[userId]/profile
 * Proxy to backend /api/users/:userId endpoint
 * The backend handles fetching user profile data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate userId format (same as backend)
    if (!/^[a-z0-9]+$/.test(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Get auth token from cookies to pass to backend (optional for profile)
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Proxy to backend /api/users/:userId endpoint
    const backendUrl = `${BACKEND_URL}/api/users/${userId}`;

    console.log(`[user/profile] Proxying GET to backend: ${backendUrl}`);

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    };

    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      console.error(
        `[user/profile] Backend error (${response.status}):`,
        error
      );
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[user/profile] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
