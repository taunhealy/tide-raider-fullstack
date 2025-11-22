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

  // If NEXT_PUBLIC_API_URL is explicitly set, always use it (for both dev and prod)
  if (envUrl) {
    return envUrl;
  }

  // In development, use localhost backend
  if (isDevelopment) {
    return "http://localhost:4001";
  }

  // In production, use Cloud Run backend
  return "https://tide-raider-backend-o6rx5gs5rq-uc.a.run.app";
};

export const API_CONFIG = {
  baseUrl: getBackendUrl(),
  timeout: 30000, // 30 seconds
  retries: 3,
};

// Check if we should use backend API or Next.js API routes
export const USE_BACKEND_API =
  process.env.NEXT_PUBLIC_USE_BACKEND_API !== "false";
