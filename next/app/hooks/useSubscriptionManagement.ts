import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSubscriptionManagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      subscriptionId,
    }: {
      action: "cancel" | "suspend" | "activate";
      subscriptionId: string;
    }) => {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          subscriptionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to manage subscription");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Subscription updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update subscription");
    },
  });
}
