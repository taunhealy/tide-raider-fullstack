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
    let lastFetchTime = 0;
    const FETCH_THROTTLE_MS = 5000; // Only fetch once every 5 seconds

    async function fetchUser() {
      // Throttle requests to prevent infinite loops
      const now = Date.now();
      if (now - lastFetchTime < FETCH_THROTTLE_MS) {
        return;
      }
      lastFetchTime = now;

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
    // Throttled to prevent excessive requests
    const handleFocus = () => {
      if (mounted) {
        fetchUser();
      }
    };

    // Listen for custom refresh event (triggered after subscription sync)
    const handleRefresh = () => {
      if (mounted) {
        fetchUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("auth-refresh", handleRefresh);

    return () => {
      mounted = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("auth-refresh", handleRefresh);
    };
  }, []);

  // Expose refetch function
  const refetch = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error("[useBackendAuth] Refetch error:", error);
      setAuthState({
        user: null,
        loading: false,
        error: error as Error,
      });
    }
  };

  const signOut = async () => {
    try {
      // Use Next.js API route (same domain = cookies work properly)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear local state immediately
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });

      // Small delay to ensure cookie is cleared before redirect
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect to home
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if there's an error, clear local state and redirect
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      window.location.href = "/";
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
    refetch,
  };
}
