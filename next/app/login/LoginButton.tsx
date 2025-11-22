"use client";

import { useState } from "react";

// Import from single source of truth
import { getBackendUrl } from "@/app/lib/api-config";

interface LoginButtonProps {
  callbackUrl: string;
}

export default function LoginButton({ callbackUrl }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    setIsLoading(true);
    setError("");

    try {
      // Redirect to backend OAuth endpoint
      // Backend will handle OAuth flow and redirect back with cookie
      // Pass full frontend URL in state so backend knows where to redirect
      const frontendUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const fullCallbackUrl = callbackUrl.startsWith("http")
        ? callbackUrl
        : `${frontendUrl}${callbackUrl}`;
      const state = encodeURIComponent(fullCallbackUrl);

      const BACKEND_URL = getBackendUrl();

      console.log(`[LoginButton] Frontend URL: ${frontendUrl}`);
      console.log(`[LoginButton] Callback URL: ${callbackUrl}`);
      console.log(`[LoginButton] Full callback URL: ${fullCallbackUrl}`);
      console.log(`[LoginButton] Encoded state: ${state}`);
      console.log(`[LoginButton] Backend URL: ${BACKEND_URL}`);

      window.location.href = `${BACKEND_URL}/api/auth/google?state=${state}`;
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full py-2 px-4 bg-[var(--color-tertiary)] text-white rounded-md hover:opacity-90 transition-colors"
      >
        {isLoading ? "Signing in..." : "Sign in with Google"}
      </button>
    </>
  );
}
