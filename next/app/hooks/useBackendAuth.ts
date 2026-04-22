"use client";

import React, { useState, useEffect, useRef } from "react";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isSubscribed?: boolean;
  subscriptionStatus?: string;
  hasActiveTrial?: boolean;
  trialEndDate?: Date | null;
  whatsappNumber?: string | null;
  referralCode?: string;
  credits?: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// Shared state across all hook instances to prevent multiple simultaneous requests
let globalLastFetchTime = 0;
const FETCH_THROTTLE_MS = 10000; // Only fetch once every 10 seconds globally

// Shared cache for auth state across all components
let globalAuthCache: {
  state: AuthState | null;
  timestamp: number;
  pendingPromise: Promise<AuthState> | null;
} = {
  state: null,
  timestamp: 0,
  pendingPromise: null,
};

const CACHE_DURATION_MS = 30000; // Cache auth state for 30 seconds

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

    async function fetchUser(bypassThrottle = false): Promise<AuthState> {
      const now = Date.now();

      // Check cache first (if valid and not bypassing)
      if (
        !bypassThrottle &&
        globalAuthCache.state &&
        now - globalAuthCache.timestamp < CACHE_DURATION_MS
      ) {
        console.log("[useBackendAuth] Using cached auth state");
        if (mounted) {
          setAuthState(globalAuthCache.state);
        }
        return globalAuthCache.state;
      }

      // If there's a pending fetch, wait for it instead of starting a new one
      if (globalAuthCache.pendingPromise) {
        console.log("[useBackendAuth] Waiting for pending auth fetch");
        try {
          const cachedState = await globalAuthCache.pendingPromise;
          if (mounted) {
            setAuthState(cachedState);
          }
          return cachedState;
        } catch (error) {
          // If pending fetch fails, continue to fetch ourselves
          console.warn(
            "[useBackendAuth] Pending fetch failed, fetching ourselves"
          );
        }
      }

      // Global throttle to prevent multiple instances from fetching simultaneously
      // But allow initial fetch to bypass throttle
      if (!bypassThrottle && now - globalLastFetchTime < FETCH_THROTTLE_MS) {
        // If throttled, use cached state if available, otherwise stop loading
        if (globalAuthCache.state) {
          if (mounted) {
            setAuthState(globalAuthCache.state);
          }
          return globalAuthCache.state;
        }
        if (mounted) {
          setAuthState((prev) => ({
            ...prev,
            loading: false, // Stop loading even if throttled
          }));
        }
        return { user: null, loading: false, error: null };
      }
      globalLastFetchTime = now;

      // Create the internal fetch function
      async function doFetch() {
        const fetchStartTime = Date.now();
        try {
          // Use Next.js API route (same domain = cookies work)
          // Increased timeout to 60 seconds to allow for network latency
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, 60000);

          let response;
          try {
            response = await fetch("/api/auth/me", {
              credentials: "include",
              cache: "no-store",
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === "AbortError") throw fetchError;
            
            const errorState: AuthState = { user: null, loading: false, error: null };
            globalAuthCache = { state: errorState, timestamp: Date.now(), pendingPromise: null };
            if (mounted) setAuthState(errorState);
            return errorState;
          }

          let authState: AuthState;
          if (response.ok) {
            try {
              const data = await response.json();
              authState = { user: data.user || null, loading: false, error: null };
            } catch (pError) {
              authState = { user: null, loading: false, error: null };
            }
          } else {
            authState = { user: null, loading: false, error: null };
          }

          // Update global cache
          globalAuthCache = { state: authState, timestamp: Date.now(), pendingPromise: null };
          if (mounted) setAuthState(authState);
          return authState;
        } catch (error) {
          const authState: AuthState = { user: null, loading: false, error: null };
          globalAuthCache = { state: authState, timestamp: Date.now(), pendingPromise: null };
          if (mounted) setAuthState(authState);
          return authState;
        } finally {
          globalAuthCache.pendingPromise = null;
        }
      }

      // EXECUTE AND CACHE PROMISE IMMEDIATELY
      const currentFetchPromise = doFetch();
      globalAuthCache.pendingPromise = currentFetchPromise;

      // Add a safety timeout
      const safetyTimeout = setTimeout(() => {
        if (globalAuthCache.pendingPromise === currentFetchPromise) {
          globalAuthCache.pendingPromise = null;
        }
      }, 15000); // 15 second safety timeout

      // Clear safety timeout when promise resolves
      currentFetchPromise.finally(() => {
        clearTimeout(safetyTimeout);
        // Only clear if this is still the current pending promise
        if (globalAuthCache.pendingPromise === currentFetchPromise) {
          globalAuthCache.pendingPromise = null;
        }
      });

      return currentFetchPromise;
    }

    // Only do initial fetch once per component mount
    // But check global cache first to prevent flooding on simultaneous mounts
    if (!hasInitialFetch.current) {
      const now = Date.now();
      const hasValidCache = globalAuthCache.state && (now - globalAuthCache.timestamp < CACHE_DURATION_MS);
      
      if (hasValidCache) {
        console.log("[useBackendAuth] Syncing mount with valid global cache");
        setAuthState(globalAuthCache.state!);
      } else {
        console.log(
          "[useBackendAuth] Starting initial fetch (bypassing throttle)"
        );
        fetchUser(true).catch((error) => {
          console.error("[useBackendAuth] Initial fetch error:", error);
          if (mounted) {
            setAuthState({
              user: null,
              loading: false,
              error: error instanceof Error ? error : null,
            });
          }
        });
      }
      hasInitialFetch.current = true;
    }

    // Listen for storage events (when token is set in another tab/window)
    const handleStorageChange = () => {
      if (mounted) {
        // Clear cache and reset throttle for storage events (user might have signed in elsewhere)
        globalAuthCache = { state: null, timestamp: 0, pendingPromise: null };
        globalLastFetchTime = 0;
        fetchUser(true).catch((error) => {
          console.error("[useBackendAuth] Storage change fetch error:", error);
        });
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
          fetchUser().catch((error) => {
            // Silently handle focus fetch errors - don't spam console
            // Network errors during focus are common (offline, etc.)
            if (error instanceof Error && error.name !== "AbortError") {
              console.warn(
                "[useBackendAuth] Focus fetch error (non-critical):",
                error.message
              );
            }
            // Don't update state on focus fetch errors - keep existing state
          });
        }
      }
    };

    // Listen for custom refresh event (triggered after subscription sync)
    const handleRefresh = () => {
      if (mounted) {
        // Clear cache and reset throttle to bypass for manual refresh events
        globalAuthCache = { state: null, timestamp: 0, pendingPromise: null };
        globalLastFetchTime = 0;
        fetchUser(true).catch((error) => {
          console.error("[useBackendAuth] Refresh fetch error:", error);
        });
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

  // Memoize the return value to prevent infinite render loops in components
  // that use the session/data object in dependency arrays
  return React.useMemo(() => {
    const status = authState.loading
      ? "loading"
      : authState.user
        ? "authenticated"
        : "unauthenticated";

    return {
      data: authState.user ? { user: authState.user } : null,
      status,
      signOut,
      refetch,
    };
  }, [authState.loading, authState.user]);
}
