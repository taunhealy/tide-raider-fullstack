/**
 * API Configuration
 * Centralized configuration for backend API
 */

// Use NEXT_PUBLIC_API_URL if set, otherwise use environment-appropriate default
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";

  // In development, use localhost backend (connects to Docker postgres)
  if (isDevelopment) {
    return envUrl || "http://localhost:4001";
  }

  // In production, use production backend (connects to Fly.io postgres)
  return envUrl || "https://tide-raider-backend.fly.dev";
};

export const API_CONFIG = {
  baseUrl: getBackendUrl(),
  timeout: 30000, // 30 seconds
  retries: 3,
};

// Check if we should use backend API or Next.js API routes
export const USE_BACKEND_API =
  process.env.NEXT_PUBLIC_USE_BACKEND_API !== "false";
