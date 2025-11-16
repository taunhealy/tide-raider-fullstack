// Redirect to backend OAuth instead of NextAuth
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const handleSignIn = (callbackUrl?: string) => {
  const currentPath = window.location.pathname;
  const redirectUrl = callbackUrl || currentPath;

  // Redirect to backend OAuth endpoint
  const state = encodeURIComponent(redirectUrl);
  window.location.href = `${BACKEND_URL}/api/auth/google?state=${state}`;
};
