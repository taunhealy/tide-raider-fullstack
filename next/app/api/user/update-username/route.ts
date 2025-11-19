import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/app/lib/server-auth";
import { cookies } from "next/headers";

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4001";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

const BACKEND_URL = getBackendUrl();

/**
 * POST /api/user/update-username
 * Proxy to backend PUT /api/auth/me to update user's name
 * This avoids needing DATABASE_URL in the Next.js app
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await getServerAuth();
    const { name } = await req.json();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    // Get auth token from cookies
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proxy to backend using the same pattern as other routes
    const backendUrl = `${BACKEND_URL}/api/auth/me`;
    console.log("[update-username] Proxying PUT to backend:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        Cookie: cookieStore.toString(),
      },
      credentials: "include",
      body: JSON.stringify({ name: name.trim() }),
    });

    console.log("[update-username] Backend response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[update-username] Backend error:", {
        status: response.status,
        error: errorData,
      });

      // If 404, the backend route doesn't exist yet (needs deployment)
      if (response.status === 404) {
        return NextResponse.json(
          {
            error:
              "Backend endpoint not available. Please ensure the backend is running and has the latest code deployed.",
            details: "PUT /api/auth/me endpoint not found",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: errorData.error || "Failed to update username" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[update-username] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}
