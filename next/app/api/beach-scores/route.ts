import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/app/lib/api-config";

const BACKEND_URL = getBackendUrl();

/**
 * GET /api/beach-scores?beachId=xxx&date=2025-12-07
 * Fetch beach scores for all sources for a specific beach and date
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const beachId = request.nextUrl.searchParams.get("beachId");
    const date = request.nextUrl.searchParams.get("date");

    if (!beachId || !date) {
      return NextResponse.json(
        { error: "beachId and date are required" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      const backendUrl = `${BACKEND_URL}/api/beach-ratings/beach-scores?beachId=${beachId}&date=${date}`;
      response = await fetch(backendUrl, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
        signal: controller.signal,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" || error.code === "ECONNREFUSED") {
        return NextResponse.json({ scores: [] }, { status: 200 });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch beach scores" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch beach scores:", error);
    return NextResponse.json(
      { error: "Failed to fetch beach scores" },
      { status: 500 }
    );
  }
}

