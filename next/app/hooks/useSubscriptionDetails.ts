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

      // Normalize subscription status - ensure TRIAL is properly recognized
      let status = data?.subscriptionStatus || SubscriptionStatus.INACTIVE;
      if (status === "TRIAL" || status === "trial") {
        status = SubscriptionStatus.TRIAL;
      }
      
      // If hasActiveTrial is true but status is not TRIAL, set status to TRIAL
      if (data?.hasActiveTrial && status !== SubscriptionStatus.TRIAL) {
        status = SubscriptionStatus.TRIAL;
      }

      return {
        status,
        id: data?.paypalSubscriptionId || null,
        paypalSubscriptionId: data?.paypalSubscriptionId || null,
        hasActiveTrial: data?.hasActiveTrial || false,
        trialEndDate: data?.trialEndDate || null,
        hasTrialEnded: data?.hasTrialEnded || false,
        next_billing_time: data?.next_billing_time || null,
        referralCode: data?.referralCode || null,
        credits: data?.credits || 0,
      };
    },
    refetchOnWindowFocus: false,
    retry: false,
  });
}
