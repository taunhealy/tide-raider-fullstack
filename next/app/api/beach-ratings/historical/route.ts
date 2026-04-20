// v1.0.2 - Fixed duplicate regionId
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/beach-ratings/historical
 * Proxy to backend /api/beach-ratings/historical
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const searchParams = request.nextUrl.searchParams;
    const serializedParams = searchParams.toString();
    
    // Log the request for debugging
    const targetRegionId = searchParams.get("regionId");
    const date = searchParams.get("date");
    const period = searchParams.get("period");
    
    console.log(
      `[beach-ratings/historical] 📥 Request received: targetRegionId=${targetRegionId}, date=${date}, period=${period}`
    );

    const backendUrl = `${BACKEND_URL}/api/beach-ratings/historical?${serializedParams}`;
    console.log(`[beach-ratings/historical] ➡️ PROXY TO BACKEND: ${backendUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (allow for local latency)

    let response;
    try {
      console.log(`[beach-ratings/historical] 🔄 Proxying to backend: ${backendUrl}`);
      response = await fetch(backendUrl,
        {
          headers: {
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
            Cookie: cookieStore.toString(),
          },
          credentials: "include",
          signal: controller.signal,
          cache: "no-store",
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
    
    if (data?.beaches?.length === 0) {
      console.warn(`[beach-ratings/historical] ⚠️ Empty beaches array from backend for ${targetRegionId} on ${date}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch historical beach ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical beach ratings" },
      { status: 500 }
    );
  }
}
