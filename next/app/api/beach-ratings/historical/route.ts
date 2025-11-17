import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

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

    const response = await fetch(
      `${BACKEND_URL}/api/beach-ratings/historical${queryString}`,
      {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
      }
    );

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
