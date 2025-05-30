import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";

export function useHandleSubscribe() {
  const { data: session } = useSession();

  return async () => {
    try {
      if (!session?.user) {
        await signIn("google");
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
