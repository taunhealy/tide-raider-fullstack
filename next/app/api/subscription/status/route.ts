import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/lib/authOptions";
import { cookies } from "next/headers";

// Use the same backend URL as the rest of the app
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl;
  }

  // Fallback: use Cloud Run backend (EU West)
  return "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app";
};

const BACKEND_URL = getBackendUrl();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { isSubscribed: false, hasActiveTrial: false },
        { status: 200 } // Return 200 instead of 401 for unauthenticated users
      );
    }

    // Get auth token from cookie or session
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    // Try to fetch from backend API
    // Add timeout to prevent hanging when backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          isSubscribed: data.user?.isSubscribed || false,
          hasActiveTrial: data.user?.hasActiveTrial || false,
        });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Handle connection errors gracefully
      const isConnectionError =
        error?.name === "AbortError" ||
        error?.code === "ECONNREFUSED" ||
        (error?.cause && error.cause.code === "ECONNREFUSED") ||
        error?.message?.includes("ECONNREFUSED") ||
        error?.message?.includes("fetch failed");

      if (isConnectionError) {
        console.warn(
          "[subscription/status] Backend not available, using fallback values"
        );
      } else {
        console.error("[subscription/status] Backend API error:", error);
      }
    }

    // Fallback to default values if backend is unavailable
    return NextResponse.json({
      isSubscribed: false,
      hasActiveTrial: false,
    });
  } catch (error) {
    // Return default values on any error
    console.error("[subscription/status] Error:", error);
    return NextResponse.json({
      isSubscribed: false,
      hasActiveTrial: false,
    });
  }
}
