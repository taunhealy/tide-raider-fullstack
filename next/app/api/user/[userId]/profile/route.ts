import { NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";

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
 * GET /api/user/[userId]/profile
 * Proxy to backend to get user profile data
 * This avoids needing DATABASE_URL in the Next.js app
 */
export async function GET(
  request: Request,
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

    // Get auth token from cookies for backend request
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      // Proxy to backend API - use the main user endpoint which should return profile data
      response = await fetch(`${BACKEND_URL}/api/user/${userId}`, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...(authToken && { Cookie: `auth-token=${authToken}` }),
        },
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Handle connection errors gracefully
      if (
        fetchError.name === "AbortError" ||
        fetchError.code === "ECONNREFUSED" ||
        fetchError.message?.includes("ECONNREFUSED") ||
        fetchError.message?.includes("fetch failed")
      ) {
        console.error(
          "[user/profile] Backend connection failed:",
          fetchError.message
        );
        return NextResponse.json(
          { error: "Backend unavailable" },
          { status: 503 }
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: response.status }
      );
    }

    const userData = await response.json();

    // Return only the profile fields needed
    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      image: userData.image,
      nationality: userData.nationality,
      link: userData.link,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
