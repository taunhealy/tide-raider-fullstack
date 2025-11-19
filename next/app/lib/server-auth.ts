import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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

export interface ServerAuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isSubscribed?: boolean;
  hasActiveTrial?: boolean;
  trialEndDate?: Date | null;
}

/**
 * Get the current authenticated user from backend auth
 * This is for use in server components and server actions
 */
export async function getServerAuth(): Promise<{
  user: ServerAuthUser | null;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return { user: null };
    }

    // Verify the JWT token
    const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      console.error(
        "[server-auth] NEXTAUTH_SECRET or AUTH_SECRET not configured"
      );
      return { user: null, error: "Auth secret not configured" };
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authToken, secret);
    } catch (error) {
      // Token invalid or expired
      return { user: null };
    }

    // Call backend to get full user data
    // Add timeout to prevent hanging when backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let response;
    try {
      const cookieHeader = cookieStore.toString();
      response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: cookieHeader,
        },
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      // Handle connection errors gracefully
      const isConnectionError =
        fetchError.name === "AbortError" ||
        fetchError.code === "ECONNREFUSED" ||
        (fetchError.cause && fetchError.cause.code === "ECONNREFUSED") ||
        fetchError.message?.includes("ECONNREFUSED") ||
        fetchError.message?.includes("fetch failed");

      if (isConnectionError) {
        console.warn(
          "[server-auth] Backend not available, returning null user"
        );
        return { user: null };
      }
      throw fetchError; // Re-throw other errors
    }

    if (!response.ok) {
      return { user: null };
    }

    const data = await response.json();
    return { user: data.user || null };
  } catch (error) {
    console.error("[server-auth] Error:", error);
    return { user: null };
  }
}
