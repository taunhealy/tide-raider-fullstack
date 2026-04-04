import { API_CONFIG } from "./api-config";
import { cookies } from "next/headers";

const BACKEND_URL = API_CONFIG.baseUrl;

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

    // Don't verify the token here - the backend signed it with JWT_SECRET, not NEXTAUTH_SECRET
    // Just pass it through and let the backend verify it (same approach as the proxy route)

    // Call backend to get full user data
    // Add timeout to prevent hanging when backend is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let response;
    try {
      response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: `auth-token=${authToken}`,
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
      console.warn(
        `[server-auth] Backend auth failed: ${response.status} ${response.statusText}`
      );
      return { user: null };
    }

    const data = await response.json();
    return { user: data.user || null };
  } catch (error) {
    console.error("[server-auth] Error:", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
