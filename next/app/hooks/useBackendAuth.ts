"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isSubscribed?: boolean;
  hasActiveTrial?: boolean;
  trialEndDate?: Date | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to get authentication state from backend
 * Replaces NextAuth's useSession
 * Uses Next.js API route to proxy backend request (cookies work on same domain)
 */
export function useBackendAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      try {
        // Use Next.js API route (same domain = cookies work)
        const response = await fetch("/api/auth/me", {
          credentials: "include", // Include cookies (auth-token)
          cache: "no-store", // Don't cache auth requests
        });

        if (response.ok) {
          const data = await response.json();
          if (mounted) {
            setAuthState({
              user: data.user,
              loading: false,
              error: null,
            });
          }
        } else {
          // Not authenticated
          if (mounted) {
            setAuthState({
              user: null,
              loading: false,
              error: null,
            });
          }
        }
      } catch (error) {
        console.error("[useBackendAuth] Error fetching user:", error);
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: error as Error,
          });
        }
      }
    }

    fetchUser();

    // Listen for storage events (when token is set in another tab/window)
    const handleStorageChange = () => {
      if (mounted) {
        fetchUser();
      }
    };

    // Listen for focus events (user might have signed in in another tab)
    const handleFocus = () => {
      if (mounted) {
        fetchUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      mounted = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const signOut = async () => {
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== "undefined" &&
        window.location.hostname === "localhost"
          ? "http://localhost:3001"
          : "https://tide-raider-backend.fly.dev");

      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      // Redirect to home or signin
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return {
    data: authState.user ? { user: authState.user } : null,
    status: authState.loading
      ? "loading"
      : authState.user
        ? "authenticated"
        : "unauthenticated",
    signOut,
  };
}
