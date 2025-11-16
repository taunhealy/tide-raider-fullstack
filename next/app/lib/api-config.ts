/**
 * API Configuration
 * Centralized configuration for backend API
 */

export const API_CONFIG = {
  baseUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://tide-raider-backend.fly.dev"
      : "http://localhost:3001"),
  timeout: 30000, // 30 seconds
  retries: 3,
};

// Check if we should use backend API or Next.js API routes
export const USE_BACKEND_API =
  process.env.NEXT_PUBLIC_USE_BACKEND_API !== "false";
