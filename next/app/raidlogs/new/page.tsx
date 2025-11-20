"use client";

import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";

export default function NewRaidLogPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useBackendAuth();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

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

  // Detect if backend is unavailable (after a reasonable timeout)
  // But don't show error if we're processing a token from OAuth callback
  useEffect(() => {
    if (authStatus === "loading" && !isProcessingToken) {
      // Set a timeout to detect if backend is unavailable
      // Reduced to 12 seconds to match useBackendAuth's 10s timeout + buffer
      const timeoutId = setTimeout(() => {
        // If still loading after 12 seconds, likely backend is down
        // useBackendAuth has a 10s timeout, so this gives it time plus buffer
        console.warn("[NewRaidLogPage] Auth loading timeout after 12 seconds");
        setBackendUnavailable(true);
        setAuthTimeout(true);
      }, 12000); // 12 second timeout (longer than useBackendAuth's 10s)

      return () => clearTimeout(timeoutId);
    } else {
      // Reset when auth completes
      setAuthTimeout(false);
      setBackendUnavailable(false);
    }
  }, [authStatus, isProcessingToken]);

  // Redirect to login if not authenticated (use useEffect to avoid render issues)
  useEffect(() => {
    if (
      authStatus === "unauthenticated" ||
      (!session?.user && authStatus !== "loading")
    ) {
      router.push("/login");
    }
  }, [authStatus, session, router]);

  // Removed timeout error - let the fetch handle timeouts naturally
  // If fetch fails, it will set status to "unauthenticated" and redirect to login

  // If we have session data, proceed immediately (don't wait for status to update)
  if (session?.user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <RaidLogForm
          isOpen={true}
          onClose={() => router.push("/raidlogs")}
          userEmail={session.user.email || ""}
        />
      </div>
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

    // If backend appears unavailable, show helpful message
    if (backendUnavailable || authTimeout) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-4 font-primary text-[var(--color-primary)]">
              Backend Not Available
            </h2>
            <p className="text-gray-600 mb-4 font-primary">
              The backend server at{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                localhost:4001
              </code>{" "}
              appears to be not running or not responding.
            </p>
            <p className="text-sm text-gray-500 mb-6 font-primary">
              Please start the backend server and try again.
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
                onClick={() => window.location.reload()}
                variant="default"
                className="font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Normal loading state with timeout indicator
    // If loading for more than 10 seconds, show a message suggesting retry
    const [showRetrySuggestion, setShowRetrySuggestion] = useState(false);
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
