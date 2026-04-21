"use client";

import React, { useState, useEffect, useRef } from "react";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isSubscribed?: boolean;
  hasActiveTrial?: boolean;
  trialEndDate?: Date | null;
  whatsappNumber?: string | null;
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

      // Create the promise and set it IMMEDIATELY so other components wait for it
      const currentFetchPromise = (async () => {
        const fetchStartTime = Date.now();
        try {
          // Use Next.js API route (same domain = cookies work)
          // Increased timeout to 60 seconds to allow for network latency to africa-south1
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            const elapsed = Date.now() - fetchStartTime;
            console.warn(
              `[useBackendAuth] Fetch timeout after ${elapsed}ms - aborting`
            );
            controller.abort();
          }, 60000); // 60 second timeout

          let response;
          try {
            const startTime = Date.now();
            response = await fetch("/api/auth/me", {
              credentials: "include", // Include cookies (auth-token)
              cache: "no-store", // Don't cache auth requests
              signal: controller.signal,
            });
            const duration = Date.now() - startTime;
            console.log(`[useBackendAuth] Fetch completed in ${duration}ms`);
            clearTimeout(timeoutId);
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            // Handle network errors (offline, CORS, etc.)
            if (fetchError.name === "AbortError") {
              throw fetchError; // Re-throw abort errors to be handled below
            }
            // For other fetch errors (network failures), treat as unauthenticated
            console.warn(
              "[useBackendAuth] Network error during fetch:",
              fetchError.message
            );
            const authState: AuthState = {
              user: null,
              loading: false,
              error: null, // Don't show network errors as user errors
            };
            globalAuthCache = {
              state: authState,
              timestamp: Date.now(),
              pendingPromise: null,
            };
            if (mounted) {
              setAuthState(authState);
            }
            return authState;
          }

          let authState: AuthState;
          if (response.ok) {
            // Add timeout for JSON parsing in case response hangs
            const parseController = new AbortController();
            const parseTimeout = setTimeout(
              () => parseController.abort(),
              5000
            ); // 5s timeout for parsing

            let data;
            try {
              // Try to parse response with timeout
              const jsonPromise = response.json();
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("JSON parse timeout")), 5000)
              );
              data = await Promise.race([jsonPromise, timeoutPromise]);
              clearTimeout(parseTimeout);

              console.log("[useBackendAuth] User data fetched:", {
                userId: data.user?.id,
                email: data.user?.email,
                whatsappNumber: data.user?.whatsappNumber,
                isSubscribed: data.user?.isSubscribed,
                hasActiveTrial: data.user?.hasActiveTrial,
                trialEndDate: data.user?.trialEndDate,
                hasUser: !!data.user,
              });
            } catch (parseError) {
              clearTimeout(parseTimeout);
              console.error(
                "[useBackendAuth] Failed to parse response:",
                parseError
              );
              // If parsing fails, treat as unauthenticated
              authState = {
                user: null,
                loading: false,
                error: null,
              };
              // Update cache and return early
              globalAuthCache = {
                state: authState,
                timestamp: Date.now(),
                pendingPromise: null,
              };
              if (mounted) {
                setAuthState(authState);
              }
              return authState;
            }

            authState = {
              user: data.user || null,
              loading: false,
              error: null,
            };
          } else {
            // Not authenticated
            console.log(
              "[useBackendAuth] Response not OK:",
              response.status,
              response.statusText
            );
            authState = {
              user: null,
              loading: false,
              error: null,
            };
          }

          // Update global cache
          globalAuthCache = {
            state: authState,
            timestamp: Date.now(),
            pendingPromise: null,
          };

          if (mounted) {
            setAuthState(authState);
          }

          return authState;
        } catch (error) {
          const elapsed = Date.now() - fetchStartTime;
          console.error(
            `[useBackendAuth] Error fetching user after ${elapsed}ms:`,
            error
          );
          // If it's a timeout or abort, treat as unauthenticated rather than error
          const isTimeout =
            error instanceof Error &&
            (error.name === "AbortError" ||
              error.message?.includes("timeout") ||
              error.message?.includes("abort"));

          // Always clear loading state on error
          const authState: AuthState = {
            user: null,
            loading: false, // CRITICAL: Always set loading to false
            error: isTimeout ? null : (error as Error), // Don't show error for timeouts
          };

          // Update global cache (even on error, cache the unauthenticated state briefly)
          globalAuthCache = {
            state: authState,
            timestamp: Date.now(),
            pendingPromise: null,
          };

          if (mounted) {
            console.log(`[useBackendAuth] Setting auth state after error:`, {
              loading: authState.loading,
              hasUser: !!authState.user,
              error: authState.error?.message,
            });
            setAuthState(authState);
          }

          return authState;
        } finally {
          // Ensure pending promise is cleared even if something goes wrong
          const elapsed = Date.now() - fetchStartTime;
          console.log(
            `[useBackendAuth] Fetch promise completed after ${elapsed}ms`
          );
          globalAuthCache.pendingPromise = null;
        }
      })();

      // Set pending promise IMMEDIATELY so other components can wait for this fetch
      globalAuthCache.pendingPromise = currentFetchPromise;

      // Add a safety timeout to ensure loading state is cleared even if promise hangs
      const safetyTimeout = setTimeout(() => {
        if (globalAuthCache.pendingPromise === currentFetchPromise) {
          console.warn(
            "[useBackendAuth] Safety timeout - clearing pending promise after 15 seconds"
          );
          globalAuthCache.pendingPromise = null;
          // Force update to clear loading state
          if (mounted) {
            setAuthState((prev) => {
              if (prev.loading) {
                console.warn(
                  "[useBackendAuth] Safety timeout - forcing loading to false"
                );
                return {
                  ...prev,
                  loading: false,
                  user: prev.user || null, // Keep user if already set
                };
              }
              return prev;
            });
          }
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
