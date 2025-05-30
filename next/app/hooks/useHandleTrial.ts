import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useHandleTrial() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: {
      onMutate?: () => void;
      onSettled?: () => void;
    }) => {
      if (!session?.user) {
        throw new Error("Must be logged in to start trial");
      }

      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-trial" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start trial");
      }

      options?.onMutate?.();
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}
