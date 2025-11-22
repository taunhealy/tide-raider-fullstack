import { useBackendAuth } from "./useBackendAuth";
import { toast } from "sonner";

// Import from single source of truth
import { getBackendUrl } from "@/app/lib/api-config";

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
