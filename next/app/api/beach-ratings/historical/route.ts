import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Always use production backend if env URL is localhost (since database is live)
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  // If env URL is localhost, always use production
  if (envUrl?.includes("localhost")) {
    return "https://tide-raider-backend.fly.dev";
  }
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/beach-ratings/historical
 * Proxy to backend /api/beach-ratings/historical
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let response;
    try {
      response = await fetch(
        `${BACKEND_URL}/api/beach-ratings/historical${queryString}`,
        {
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
            Cookie: cookieStore.toString(),
          },
          credentials: "include",
          signal: controller.signal,
        }
      );
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
        console.warn("[beach-ratings/historical] Backend connection failed, returning empty beaches");
        return NextResponse.json({ beaches: [] }, { status: 200 });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      // Handle 429 gracefully - return empty beaches array (frontend expects { beaches: [] })
      if (response.status === 429) {
        console.warn(
          "[beach-ratings/historical] Rate limited, returning empty beaches array"
        );
        return NextResponse.json({ beaches: [] }, { status: 200 });
      }
      return NextResponse.json(
        { error: "Failed to fetch historical beach ratings" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch historical beach ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical beach ratings" },
      { status: 500 }
    );
  }
}
