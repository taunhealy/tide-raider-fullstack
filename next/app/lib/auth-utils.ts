// Redirect to backend OAuth instead of NextAuth
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

const BACKEND_URL =
  typeof window !== "undefined"
    ? getBackendUrl()
    : "https://tide-raider-backend.fly.dev";

export const handleSignIn = (callbackUrl?: string) => {
  const currentPath = window.location.pathname;
  const frontendUrl = window.location.origin;
  const redirectUrl = callbackUrl || currentPath;

  // Build full callback URL with frontend origin
  const fullCallbackUrl = redirectUrl.startsWith("http")
    ? redirectUrl
    : `${frontendUrl}${redirectUrl}`;

  // Redirect to backend OAuth endpoint
  // Pass full frontend URL in state so backend knows where to redirect
  const state = encodeURIComponent(fullCallbackUrl);
  window.location.href = `${BACKEND_URL}/api/auth/google?state=${state}`;
};
