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
      
      // If the callbackUrl is a gated/protected route, redirect back to /login first to set the token,
      // otherwise Next.js middleware will block the callback redirect because the cookie isn't set yet.
      const isProtected = callbackUrl.startsWith("/raidlogs") || 
        (callbackUrl.startsWith("/raid") && (() => {
          const queryStr = callbackUrl.includes("?") ? callbackUrl.split("?")[1] : "";
          const params = new URLSearchParams(queryStr);
          const page = parseInt(params.get("page") || "1", 10);
          return page >= 2;
        })());

      let redirectPath = callbackUrl;
      if (isProtected) {
        redirectPath = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }

      let fullCallbackUrl = redirectPath.startsWith("http")
        ? redirectPath
        : `${frontendUrl}${redirectPath}`;

      // Append referral code to state if exists
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref") || document.cookie.split("; ").find(row => row.startsWith("referral-code="))?.split("=")[1];
      
      if (refCode) {
        fullCallbackUrl += (fullCallbackUrl.includes("?") ? "&" : "?") + `ref=${refCode}`;
        console.log(`[LoginButton] 🔗 Injecting referral code into state: ${refCode}`);
      }

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
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading}
        suppressHydrationWarning
        className="w-fit mx-auto h-12 relative px-6 py-2.5 rounded-xl transition-all duration-300 border flex items-center gap-3 bg-white border-gray-100 text-gray-900 hover:bg-gray-50 group/login disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <div className="mx-auto w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        ) : (
          <>
            <div className="bg-gray-100 p-1.5 rounded-lg shrink-0 group-hover/login:bg-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            </div>
            <span className="font-semibold text-xs tracking-tight">
              Sign in with Google
            </span>
          </>
        )}
      </button>
    </div>
  );
}
