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

const BACKEND_URL = getBackendUrl();

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
