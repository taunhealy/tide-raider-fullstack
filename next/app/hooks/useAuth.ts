"use client";

import { useBackendAuth } from "./useBackendAuth";

/**
 * useAuth hook - now uses backend authentication instead of NextAuth
 * Maintains same API for backward compatibility
 */
export function useAuth() {
  const { data: session, status } = useBackendAuth();

  return {
    session,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
