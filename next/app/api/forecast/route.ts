import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

/**
 * GET /api/forecast
 * Proxy to backend /api/forecast
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : "";

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/forecast${queryString}`, {
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      // Handle 429 gracefully - return null (frontend handles null gracefully)
      if (response.status === 429) {
        console.warn("[forecast] Rate limited, returning null");
        return NextResponse.json(null, { status: 200 });
      }
      return NextResponse.json(
        { error: "Failed to fetch forecast data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast data" },
      { status: 500 }
    );
  }
}
