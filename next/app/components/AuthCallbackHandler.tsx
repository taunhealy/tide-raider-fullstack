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
        credentials: "include", // Include cookies
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to set token: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            console.log("[AuthCallbackHandler] Token set successfully");
            // Remove token from URL
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search
            );
            setStatus("done");
            // Small delay to ensure cookie is set, then reload
            setTimeout(() => {
              window.location.reload();
            }, 100);
          } else {
            throw new Error("Token setting failed");
          }
        })
        .catch((error) => {
          console.error(
            "[AuthCallbackHandler] Failed to set auth token:",
            error
          );
          setStatus("done");
          // Redirect to signin with error
          window.location.href = "/auth/signin?error=TokenSetFailed";
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
