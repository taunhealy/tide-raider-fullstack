// Import from single source of truth
import { getBackendUrl } from "./api-config";

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
  const oauthUrl = `${BACKEND_URL}/api/auth/google?state=${state}`;
  
  // Log helpful message in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Auth] Redirecting to backend OAuth: ${oauthUrl}`);
    if (BACKEND_URL.includes("localhost")) {
      console.log(`[Auth] ⚠️ Make sure backend is running at ${BACKEND_URL}`);
    }
  }
  
  window.location.href = oauthUrl;
};
