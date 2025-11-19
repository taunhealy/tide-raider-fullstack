"use client";

import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useEffect, useState } from "react";

export default function NewRaidLogPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useBackendAuth();
  const [authTimeout, setAuthTimeout] = useState(false);

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
      });
    }
  }, [authStatus, session]);

  // Remove artificial timeout - let the fetch timeout handle it
  // The fetch already has a 20-second timeout, so we don't need an additional UI timeout
  useEffect(() => {
    // Reset timeout state when auth completes
    if (authStatus !== "loading") {
      setAuthTimeout(false);
    }
  }, [authStatus]);

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

  // Show loader while auth is loading
  if (authStatus === "loading") {
    return <RandomLoader isLoading={true} />;
  }

  // Don't render form if not authenticated (redirect will happen via useEffect)
  // This should not be reached if session?.user exists (checked above)
  return <RandomLoader isLoading={true} />;
}
