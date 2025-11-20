"use client";

import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useEffect, useState } from "react";
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

  // Normal loading state with timeout indicator
  // If loading for more than 10 seconds, show a message suggesting retry
  useEffect(() => {
    if (authStatus === "loading" && !isProcessingToken) {
      const retryTimeout = setTimeout(() => {
        setShowRetrySuggestion(true);
      }, 10000); // Show retry suggestion after 10 seconds

      return () => clearTimeout(retryTimeout);
    } else {
      setShowRetrySuggestion(false);
    }
  }, [authStatus, isProcessingToken]);

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

    // If we have a session, clear any error flags
    if (session?.user) {
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

  // Detect if backend is unavailable (after a reasonable timeout)
  // But don't show error if we're processing a token from OAuth callback
  useEffect(() => {
    if (authStatus === "loading" && !isProcessingToken) {
      // Set a timeout to detect if backend is unavailable
      // Increased to 20 seconds to account for slow network/backend responses
      // useBackendAuth has a 10s timeout, /api/auth/me has 15s, so wait 20s total to be safe
      const timeoutId = setTimeout(() => {
        // Check current state - don't rely on closure value
        // If we have a session, auth completed successfully
        if (session?.user) {
          // Auth completed - clear any error flags
          setBackendUnavailable(false);
          setAuthTimeout(false);
          setHasError(false);
          return;
        }
        
        // If still loading after timeout, backend may be unavailable
        // But only set error if we're still actually loading (check current state)
        console.warn(
          "[NewRaidLogPage] Auth loading timeout after 20 seconds - checking if backend is unavailable"
        );
        // Don't set error immediately - let the next render check the actual state
        setAuthTimeout(true);
      }, 20000); // 20 second timeout (longer than /api/auth/me timeout to account for slow responses)

      return () => clearTimeout(timeoutId);
    } else {
      // Reset when auth completes (either successfully or with unauthenticated state)
      if (authStatus !== "loading") {
        setAuthTimeout(false);
        // Always reset backendUnavailable and hasError when auth completes
        // Backend is available if we got any response (even 401)
        setBackendUnavailable(false);
        setHasError(false);
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

  // Removed timeout error - let the fetch handle timeouts naturally
  // If fetch fails, it will set status to "unauthenticated" and redirect to login

  // If we have session data, proceed immediately (don't wait for status to update)
  if (session?.user) {
    return (
      <ErrorBoundary>
        <div className="p-6 max-w-4xl mx-auto">
          <RaidLogForm
            isOpen={true}
            onClose={() => router.push("/raidlogs")}
            userEmail={session.user.email || ""}
          />
        </div>
      </ErrorBoundary>
    );
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

    // Only show "Backend Not Available" if auth is STILL loading after timeout AND we don't have a session
    // This means the backend truly isn't responding (not even with 401)
    // If backend responded (even with 401), authStatus would be "unauthenticated" not "loading"
    // If we have a session, backend is clearly available
    if (authStatus === "loading" && (backendUnavailable || authTimeout) && !session?.user) {
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
                  The backend server at{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    localhost:4001
                  </code>{" "}
                  appears to be not running or not responding.
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
            <div className="flex gap-3 justify-center flex-wrap">
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
