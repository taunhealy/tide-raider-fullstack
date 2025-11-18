"use client";

import { useState } from "react";

// Always ignore localhost URLs and use production backend (since database is live)
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If env URL is localhost, always use production (database is live, not local)
  if (envUrl?.includes("localhost")) {
    return "https://tide-raider-backend.fly.dev";
  }
  
  // Use env URL if set and not localhost, otherwise use production
  return envUrl || "https://tide-raider-backend.fly.dev";
};

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
