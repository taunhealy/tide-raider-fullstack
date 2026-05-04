/**
 * API Configuration
 * Centralized configuration for backend API
 */

/**
 * SINGLE SOURCE OF TRUTH for backend URL
 *
 * This is the ONLY place where the backend URL should be defined.
 * All other files should import getBackendUrl from this file.
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable (if set)
 * 2. Cloud Run backend (production default)
 *
 * No hardcoded URLs anywhere else!
 */
export const getBackendUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // If NEXT_PUBLIC_API_URL is explicitly set and not localhost, use it
  // (In production, never use localhost even if env var is set)
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }

  // In development, use localhost backend (or env URL if set)
  if (isDevelopment) {
    // If envUrl is localhost, convert to 127.0.0.1 for server-side stability
    if (envUrl?.includes("localhost")) {
      return envUrl.replace("localhost", "127.0.0.1");
    }
    return envUrl || "http://127.0.0.1:4005";
  }

  // In production, always use Cloud Run backend (never localhost)
  return "https://tide-raider-backend-o6rx5gs5rq-ew.a.run.app";
};

export const API_CONFIG = {
  baseUrl: getBackendUrl(),
  timeout: 30000, // 30 seconds
  retries: 3,
};

// Check if we should use backend API or Next.js API routes
export const USE_BACKEND_API =
  process.env.NEXT_PUBLIC_USE_BACKEND_API !== "false";
