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

  // Handle auth timeout
  useEffect(() => {
    if (authStatus === "loading") {
      const timer = setTimeout(() => {
        setAuthTimeout(true);
      }, 10000); // 10 second timeout
      return () => clearTimeout(timer);
    } else {
      setAuthTimeout(false);
    }
  }, [authStatus]);

  // Redirect to login if not authenticated (use useEffect to avoid render issues)
  useEffect(() => {
    if (authStatus === "unauthenticated" || (!authStatus && !session?.user)) {
      router.push("/login");
    }
  }, [authStatus, session, router]);

  if (authStatus === "loading" && !authTimeout) {
    return <RandomLoader isLoading={true} />;
  }

  if (authStatus === "loading" && authTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Authentication is taking longer than expected.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--color-tertiary)] text-white rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Don't render form if not authenticated
  if (!session?.user) {
    return <RandomLoader isLoading={true} />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <RaidLogForm
        isOpen={true}
        onClose={() => router.push("/raidlogs")}
        userEmail={session.user?.email || ""}
      />
    </div>
  );
}
