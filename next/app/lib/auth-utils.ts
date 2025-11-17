// Redirect to backend OAuth instead of NextAuth
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://tide-raider-backend.fly.dev");

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
