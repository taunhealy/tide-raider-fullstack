"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

interface LoginButtonProps {
  callbackUrl: string;
}

export default function LoginButton({ callbackUrl }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("google", {
        callbackUrl,
        redirect: true,
      });

      if (result?.error) {
        setError("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
    } finally {
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