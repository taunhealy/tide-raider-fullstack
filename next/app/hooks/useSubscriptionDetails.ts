import { useQuery } from "@tanstack/react-query";
import { SubscriptionStatus } from "@/app/types/subscription";

export function useSubscriptionDetails() {
  return useQuery({
    queryKey: ["subscriptionDetails"],
    queryFn: async () => {
      const response = await fetch("/api/user/current");
      if (!response.ok) {
        throw new Error("Failed to fetch subscription details");
      }
      const data = await response.json();

      return {
        status: data?.subscriptionStatus || SubscriptionStatus.INACTIVE,
        id: data?.paypalSubscriptionId,
        hasActiveTrial: data?.hasActiveTrial,
        trialEndDate: data?.trialEndDate,
        hasTrialEnded: data?.hasTrialEnded,
        next_billing_time: data?.next_billing_time,
      };
    },
    refetchOnWindowFocus: false,
    retry: false,
  });
}
