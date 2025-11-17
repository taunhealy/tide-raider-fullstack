import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/lib/authOptions";
import { cookies } from "next/headers";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://tide-raider-backend.fly.dev");

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
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          Cookie: cookieStore.toString(),
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          isSubscribed: data.user?.isSubscribed || false,
          hasActiveTrial: data.user?.hasActiveTrial || false,
        });
      }
    } catch (error) {
      console.error("[subscription/status] Backend API error:", error);
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
