"use client";

import { RaidLogsComponent } from "@/app/components/raid-logs/RaidLogsComponent";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RaidLogsPage() {
  const { status: authStatus } = useBackendAuth();
  const router = useRouter();
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

  // Allow access even without session
  return (
    <div className="p-2 sm:p-4 md:p-4 mx-2">
      <RaidLogsComponent />
    </div>
  );
}
