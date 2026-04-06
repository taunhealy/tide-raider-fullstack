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

    // Add timeout to prevent hanging requests (30 seconds for forecast queries)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${backendUrl}/api/forecast${queryString}`, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { 
            error: errorData.error || "Failed to fetch surf conditions",
            message: errorData.message,
            details: errorData.details
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        console.warn("[forecast] Request timed out after 30 seconds");
        return NextResponse.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }
      console.error("Error fetching forecast data:", error);
      return NextResponse.json(
        { error: "Failed to fetch forecast data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in forecast route:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast data" },
      { status: 500 }
    );
  }
}
