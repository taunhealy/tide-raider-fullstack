import { useBackendAuth } from "./useBackendAuth";
import { toast } from "sonner";

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

const BACKEND_URL = getBackendUrl();

export function useHandleSubscribe() {
  const { data: session } = useBackendAuth();
  const user = session?.user;

  return async () => {
    try {
      if (!user) {
        // Redirect to backend OAuth
        const frontendUrl = window.location.origin;
        const fullCallbackUrl = `${frontendUrl}${window.location.pathname}`;
        const state = encodeURIComponent(fullCallbackUrl);
        window.location.href = `${BACKEND_URL}/api/auth/google?state=${state}`;
        return;
      }

      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to start subscription. Please try again.");
    }
  };
}
