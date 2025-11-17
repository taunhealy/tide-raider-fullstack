import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Use NEXT_PUBLIC_API_URL if set, otherwise default to production
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://tide-raider-backend.fly.dev";

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
    const cookieHeader = cookieStore.toString();
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Cookie: cookieHeader,
      },
      credentials: "include",
      cache: "no-store",
    });

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
