"use client";

import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/app/components/ui/Button";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

export default function NewRaidLogPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useBackendAuth();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showRetrySuggestion, setShowRetrySuggestion] = useState(false);
  const [backendHealth, setBackendHealth] = useState<{
    available: boolean;
    backendUrl?: string;
    error?: string;
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const loadingStartTimeRef = useRef<number | null>(null);

  // Track when loading started
  useEffect(() => {
    if (authStatus === "loading" && !isProcessingToken) {
      if (!loadingStartTimeRef.current) {
        loadingStartTimeRef.current = Date.now();
      }
    } else {
      loadingStartTimeRef.current = null;
    }
  }, [authStatus, isProcessingToken]);

  // Normal loading state with timeout indicator
  // If loading for more than 30 seconds, show a message suggesting retry
  useEffect(() => {
    if (authStatus === "loading" && !isProcessingToken) {
      const retryTimeout = setTimeout(() => {
        setShowRetrySuggestion(true);
        // Don't trigger timeout here - let the main timeout handle it
        // This is just for showing a retry suggestion
      }, 30000); // Show retry suggestion after 30 seconds

      return () => clearTimeout(retryTimeout);
    } else {
      setShowRetrySuggestion(false);
    }
  }, [authStatus, isProcessingToken, authTimeout]);

  // Check if there's a token in the URL hash (OAuth callback)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch) {
        setIsProcessingToken(true);
        // AuthCallbackHandler will process this, wait for it
        // Check again after a short delay
        const checkInterval = setInterval(() => {
          if (!window.location.hash.includes("token=")) {
            setIsProcessingToken(false);
            clearInterval(checkInterval);
          }
        }, 100);
        return () => clearInterval(checkInterval);
      }
    }
  }, []);

  // Debug logging for localhost
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    ) {
      console.log("[NewRaidLogPage] Auth state:", {
        authStatus,
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        isProcessingToken,
        hash: window.location.hash,
      });
    }
  }, [authStatus, session, isProcessingToken]);

  // Handle auth errors - only set error for actual failures, not normal unauthenticated state
  useEffect(() => {
    // Normal unauthenticated state (user not logged in) - not an error, clear any error flags
    if (authStatus === "unauthenticated") {
      setHasError(false);
      setBackendUnavailable(false);
      setAuthTimeout(false);
      return;
    }

    // If we have a session, clear any error flags (backend is clearly available)
    if (session?.user) {
      if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")
      ) {
        console.log(
          "[NewRaidLogPage] ✅ Session exists - clearing error flags"
        );
      }
      setHasError(false);
      setBackendUnavailable(false);
      setAuthTimeout(false);
      return;
    }

    // Only set error if we're not in a normal loading or unauthenticated state
    // This indicates something went wrong (backend issue, network problem, etc.)
    if (
      authStatus !== "loading" &&
      authStatus !== "unauthenticated" &&
      !session?.user
    ) {
      // This could be an error state (backend issue, etc.)
      console.warn("[NewRaidLogPage] Unexpected auth state:", {
        authStatus,
        hasSession: !!session,
        hasUser: !!session?.user,
      });
      // Don't automatically set error here - let the timeout logic handle it
    }
  }, [authStatus, session]);

  // Check backend health when auth times out
  const checkBackendHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const response = await fetch("/api/backend-health");
      const data = await response.json();
      setBackendHealth(data);
    } catch (error) {
      setBackendHealth({
        available: false,
        error: "Failed to check backend health",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  // Detect if backend is unavailable (after a reasonable timeout)
  // But don't show error if we're processing a token from OAuth callback
  useEffect(() => {
    if (authStatus === "loading" && !isProcessingToken) {
      // Increased timeout to 60 seconds to allow for network latency to africa-south1
      const timeoutId = setTimeout(() => {
        console.warn(
          "[NewRaidLogPage] Auth loading timeout after 60 seconds - checking backend health"
        );
        setAuthTimeout(true);
        // Check backend health when timeout occurs
        checkBackendHealth();
      }, 60000); // 60 second timeout

      return () => clearTimeout(timeoutId);
    } else {
      // Reset when auth completes (either successfully or with unauthenticated state)
      if (authStatus !== "loading") {
        // Always clear timeout flags when auth completes
        // Backend is available if we got any response (even 401 means backend is running)
        setAuthTimeout(false);
        setBackendUnavailable(false);
        setHasError(false);
        setBackendHealth(null);
        return; // Exit early when auth completes
      }
    }
  }, [authStatus, isProcessingToken, session]);

  // Redirect to login if not authenticated (use useEffect to avoid render issues)
  useEffect(() => {
    // Redirect if definitely unauthenticated and not in error/timeout state
    // Don't redirect if we're showing an error message (backend unavailable)
    if (
      authStatus === "unauthenticated" &&
      !hasError &&
      !authTimeout &&
      !backendUnavailable
    ) {
      const redirectTimer = setTimeout(() => {
        router.push("/login");
      }, 300);
      return () => clearTimeout(redirectTimer);
    }

    // Also redirect if loading completes with no session (but not if there's an error)
    if (
      authStatus !== "loading" &&
      !session?.user &&
      authStatus !== "authenticated" &&
      !hasError &&
      !authTimeout &&
      !backendUnavailable
    ) {
      const redirectTimer = setTimeout(() => {
        router.push("/login");
      }, 300);
      return () => clearTimeout(redirectTimer);
    }
  }, [authStatus, session, router, hasError, authTimeout, backendUnavailable]);

  // Clear error flags when we have a valid session (backend is clearly available)
  // This ensures we don't show "Backend Not Available" when backend is working
  useEffect(() => {
    if (session?.user) {
      // Debug log to confirm session exists
      if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")
      ) {
        console.log(
          "[NewRaidLogPage] ✅ Session exists - clearing error flags"
        );
      }

      // Clear any error flags since we have a valid session (backend is clearly available)
      if (authTimeout) {
        console.log("[NewRaidLogPage] Clearing authTimeout flag");
        setAuthTimeout(false);
      }
      if (backendUnavailable) {
        console.log("[NewRaidLogPage] Clearing backendUnavailable flag");
        setBackendUnavailable(false);
      }
      if (hasError) {
        console.log("[NewRaidLogPage] Clearing hasError flag");
        setHasError(false);
      }
    }
  }, [session?.user, authTimeout, backendUnavailable, hasError]);

  // Removed timeout error - let the fetch handle timeouts naturally
  // If fetch fails, it will set status to "unauthenticated" and redirect to login

  // CRITICAL: If we have session data, proceed immediately (don't wait for status to update)
  // This check MUST come before any loading/error checks to prevent false errors
  // This prevents showing "Backend Not Available" when backend is clearly working
  // The Navbar uses the same useBackendAuth hook with global cache, so if Navbar shows "Sign Out",
  // we should also have the session here (even if status is still "loading" due to network latency)
  // Add comprehensive null checks to prevent client-side exceptions
  const hasValidSession = session?.user && typeof session.user === "object";
  
  // If we have a valid session, render immediately (don't wait for authStatus to update)
  // This fixes the issue where Navbar shows "Sign Out" but this page shows "Backend Not Available"
  if (hasValidSession) {
    // Safely extract user email with null checks to prevent client-side exceptions
    const userEmailValue = session?.user?.email || "";

    try {
      return (
        <ErrorBoundary>
          <div className="p-6 max-w-4xl mx-auto">
            <RaidLogForm
              isOpen={true}
              onClose={() => router.push("/raidlogs")}
              userEmail={userEmailValue}
            />
          </div>
        </ErrorBoundary>
      );
    } catch (error) {
      console.error("[NewRaidLogPage] Error rendering form:", error);
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-4 font-primary text-red-600">
              Error Loading Form
            </h2>
            <p className="text-gray-600 mb-4 font-primary">
              There was an error loading the raid log form. Please try
              refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
              className="font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }
  }

  // Show loader while processing OAuth token or auth is loading
  if (isProcessingToken || authStatus === "loading") {
    // If processing token, show different message
    if (isProcessingToken) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <RandomLoader isLoading={true} />
            <p className="mt-4 text-gray-600 font-primary">
              Completing sign in...
            </p>
          </div>
        </div>
      );
    }

    // Show error UI if timeout has occurred OR if we've been loading for too long
    // This prevents infinite loading states
    // Also add a safety check: if we've been loading for more than 60 seconds, show error regardless
    const loadingDuration = loadingStartTimeRef.current
      ? Date.now() - loadingStartTimeRef.current
      : 0;
    const hasBeenLoadingTooLong = loadingDuration > 60000; // 60 seconds (safety net)

    const shouldShowError =
      authStatus === "loading" &&
      (authTimeout || showRetrySuggestion || hasBeenLoadingTooLong) &&
      !session?.user &&
      !isProcessingToken;

    if (shouldShowError) {
      const isProduction =
        typeof window !== "undefined" &&
        !window.location.hostname.includes("localhost") &&
        !window.location.hostname.includes("127.0.0.1");

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-4 font-primary text-[var(--color-primary)]">
              Backend Not Available
            </h2>
            <p className="text-gray-600 mb-4 font-primary">
              {isProduction ? (
                <>
                  Unable to connect to the authentication service.
                  <br />
                  <span className="text-sm text-gray-500 mt-2 block">
                    This may be a temporary issue. Please try again in a moment.
                  </span>
                </>
              ) : (
                <>
                  {backendHealth ? (
                    <>
                      {backendHealth.available ? (
                        <>
                          Backend is running at{" "}
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {backendHealth.backendUrl}
                          </code>
                          , but authentication is failing.
                          <br />
                          <span className="text-sm text-gray-500 mt-2 block">
                            Your session may have expired. Please sign in again.
                          </span>
                        </>
                      ) : (
                        <>
                          The backend server at{" "}
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {backendHealth.backendUrl || "localhost:4001"}
                          </code>{" "}
                          is not running or not reachable.
                          {backendHealth.error && (
                            <span className="text-sm text-red-500 mt-2 block">
                              Error: {backendHealth.error}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      The backend server at{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        localhost:4001
                      </code>{" "}
                      appears to be not running or not responding.
                    </>
                  )}
                  <br />
                  <span className="text-sm text-gray-500 mt-2 block">
                    Please ensure the backend is running:{" "}
                    <code className="bg-gray-100 px-1 rounded text-xs">
                      cd backend && npm run dev
                    </code>
                  </span>
                </>
              )}
            </p>
            <div className="mt-6 space-y-3">
              <Button
                onClick={checkBackendHealth}
                disabled={isCheckingHealth}
                className="w-full"
                variant="outline"
              >
                {isCheckingHealth
                  ? "Checking..."
                  : backendHealth
                    ? "Check Connection Again"
                    : "Test Backend Connection"}
              </Button>
              {backendHealth && !backendHealth.available && (
                <div className="text-sm text-left bg-gray-50 p-3 rounded">
                  <p className="font-semibold mb-1">Quick Fix:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>
                      Open a terminal in the{" "}
                      <code className="bg-gray-200 px-1 rounded">backend</code>{" "}
                      folder
                    </li>
                    <li>
                      Run:{" "}
                      <code className="bg-gray-200 px-1 rounded">
                        npm run dev
                      </code>
                    </li>
                    <li>
                      Wait for:{" "}
                      <code className="bg-gray-200 px-1 rounded">
                        🚀 Backend server running on port 4001
                      </code>
                    </li>
                    <li>Click &quot;Check Connection Again&quot; above</li>
                  </ol>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center flex-wrap mt-4">
              {backendHealth?.available ? (
                <>
                  <Button
                    onClick={async () => {
                      try {
                        // Call logout API to properly clear backend cookie
                        await fetch("/api/auth/logout", {
                          method: "POST",
                          credentials: "include",
                        });
                      } catch (error) {
                        console.warn("Error calling logout:", error);
                      }

                      // Clear any cached auth state
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem("auth-state");
                        // Also try to clear cookie client-side (backup)
                        document.cookie =
                          "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      }

                      // Redirect to sign in page
                      window.location.href =
                        "/auth/signin?callbackUrl=/raidlogs/new";
                    }}
                    variant="default"
                    className="font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
                  >
                    Sign In Again
                  </Button>
                  <Button
                    onClick={() => router.push("/raidlogs")}
                    variant="ghost"
                    className="font-primary"
                  >
                    Go Back
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => router.push("/raidlogs")}
                    variant="ghost"
                    className="font-primary"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={() => {
                      // Clear any cached auth state and reload
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem("auth-state");
                      }
                      window.location.reload();
                    }}
                    variant="default"
                    className="font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
                  >
                    Retry
                  </Button>
                  <Button
                    onClick={() => router.push("/login")}
                    variant="outline"
                    className="font-primary"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Show error message for actual authentication errors (not just unauthenticated)
    if (
      hasError &&
      authStatus !== "loading" &&
      authStatus !== "unauthenticated"
    ) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-4 font-primary text-[var(--color-primary)]">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-4 font-primary">
              There was an error checking your authentication status.
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Please try signing in again.
              </span>
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push("/raidlogs")}
                variant="ghost"
                className="font-primary"
              >
                Go Back
              </Button>
              <Button
                onClick={() => router.push("/login")}
                variant="default"
                className="font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Normal loading state with timeout indicator
    // showRetrySuggestion state is already declared at the top

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RandomLoader isLoading={true} />
          <p className="mt-4 text-gray-600 font-primary">
            Checking authentication...
          </p>
          {showRetrySuggestion && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-3 font-primary">
                Taking longer than expected...
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="font-primary"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Don't render form if not authenticated (redirect will happen via useEffect)
  // This should not be reached if session?.user exists (checked above)
  return <RandomLoader isLoading={true} />;
}
