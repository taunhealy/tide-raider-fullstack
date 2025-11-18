"use client";

import { useState, useEffect, useRef } from "react";

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

// Shared throttle across all hook instances to prevent multiple simultaneous requests
let globalLastFetchTime = 0;
const FETCH_THROTTLE_MS = 10000; // Only fetch once every 10 seconds globally

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

  // Use ref to track if we've done initial fetch
  const hasInitialFetch = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      // Global throttle to prevent multiple instances from fetching simultaneously
      const now = Date.now();
      if (now - globalLastFetchTime < FETCH_THROTTLE_MS) {
        return;
      }
      globalLastFetchTime = now;

      try {
        // Use Next.js API route (same domain = cookies work)
        const response = await fetch("/api/auth/me", {
          credentials: "include", // Include cookies (auth-token)
          cache: "no-store", // Don't cache auth requests
        });

        if (response.ok) {
          const data = await response.json();
          console.log("[useBackendAuth] User data fetched:", {
            userId: data.user?.id,
            email: data.user?.email,
            isSubscribed: data.user?.isSubscribed,
            hasActiveTrial: data.user?.hasActiveTrial,
            trialEndDate: data.user?.trialEndDate,
          });
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

    // Only do initial fetch once per component mount
    if (!hasInitialFetch.current) {
      fetchUser();
      hasInitialFetch.current = true;
    }

    // Listen for storage events (when token is set in another tab/window)
    const handleStorageChange = () => {
      if (mounted) {
        // Reset throttle for storage events (user might have signed in elsewhere)
        globalLastFetchTime = 0;
        fetchUser();
      }
    };

    // Listen for focus events (user might have signed in in another tab)
    // Only trigger if enough time has passed since last fetch
    const handleFocus = () => {
      if (mounted) {
        const now = Date.now();
        // Only fetch on focus if it's been more than 30 seconds since last fetch
        if (now - globalLastFetchTime > 30000) {
          globalLastFetchTime = 0;
          fetchUser();
        }
      }
    };

    // Listen for custom refresh event (triggered after subscription sync)
    const handleRefresh = () => {
      if (mounted) {
        // Reset throttle to bypass for manual refresh events
        globalLastFetchTime = 0;
        fetchUser();
      }
    };

    // Use a single global listener to prevent multiple listeners
    // Only add listeners if this is the first instance
    if (
      typeof window !== "undefined" &&
      !(window as any).__authListenersAdded
    ) {
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("focus", handleFocus);
      window.addEventListener("auth-refresh", handleRefresh);
      (window as any).__authListenersAdded = true;
    }

    return () => {
      mounted = false;
      // Don't remove listeners as other components might still need them
      // They'll be cleaned up when the page unloads
    };
  }, []);

  // Expose refetch function (bypasses throttle)
  const refetch = async () => {
    try {
      console.log("[useBackendAuth] Manual refetch triggered");
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[useBackendAuth] Refetch successful:", {
          userId: data.user?.id,
          isSubscribed: data.user?.isSubscribed,
          hasActiveTrial: data.user?.hasActiveTrial,
        });
        setAuthState({
          user: data.user,
          loading: false,
          error: null,
        });
      } else {
        console.log("[useBackendAuth] Refetch failed:", response.status);
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
