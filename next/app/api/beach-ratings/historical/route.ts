import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

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

    // Log the request for debugging
    const regionId = request.nextUrl.searchParams.get("regionId");
    const date = request.nextUrl.searchParams.get("date");
    console.log(
      `[beach-ratings/historical] 📥 Request received: regionId=${regionId}, date=${date}`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (allow for local latency)

    let response;
    try {
      const backendUrl = `${BACKEND_URL}/api/beach-ratings/historical${queryString}`;
      console.log(`[beach-ratings/historical] 🔄 Proxying to backend: ${backendUrl}`);
      response = await fetch(backendUrl,
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
        console.warn(
          "[beach-ratings/historical] Backend connection failed, returning empty beaches"
        );
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
    console.log(
      `[beach-ratings/historical] ✅ Response for date=${date}: ${data?.beaches?.length || 0} beaches, top beach: ${data?.beaches?.[0]?.name || "none"} (score: ${data?.beaches?.[0]?.totalScore || 0})`
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch historical beach ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical beach ratings" },
      { status: 500 }
    );
  }
}
