"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Component to handle OAuth callback
 * Reads token from URL hash and stores it via API route
 * Should be included in pages that receive OAuth redirects
 */
export function AuthCallbackHandler() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");

  useEffect(() => {
    // Check for token in URL hash (from backend OAuth redirect)
    const hash = window.location.hash;
    const tokenMatch = hash.match(/token=([^&]+)/);

    if (tokenMatch && status === "idle") {
      setStatus("processing");
      const token = decodeURIComponent(tokenMatch[1]);

      // Store token via API route (sets httpOnly cookie on frontend domain)
      fetch("/api/auth/set-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Remove token from URL
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search
            );
            setStatus("done");
            // Refresh the page to trigger auth check
            window.location.reload();
          }
        })
        .catch((error) => {
          console.error("Failed to set auth token:", error);
          setStatus("done");
        });
    }
  }, [status]);

  if (status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-primary">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return null;
}
