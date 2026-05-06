import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useBackendAuth } from "./useBackendAuth";

interface SubscriptionStatus {
  subscriptionStatus: string | null;
  hasActiveTrial: boolean;
  paypalSubscriptionId: string | null;
  isPremium: boolean;
  credits: number;
  referralCode: string | null;
}

/**
 * Hook to directly check subscription status from backend
 * More reliable than relying on context which might be cached
 */
export function useSubscriptionStatus() {
  const { data: session, status: authStatus } = useBackendAuth();
  const queryClient = useQueryClient();

  // Listen for subscription status refresh events
  useEffect(() => {
    const handleRefresh = () => {
      // Invalidate subscription status query to force refetch
      queryClient.invalidateQueries({
        queryKey: ["subscriptionStatus", session?.user?.id],
      });
    };

    window.addEventListener("subscription-status-refresh", handleRefresh);
    window.addEventListener("auth-refresh", handleRefresh); // Also listen to auth-refresh
    window.addEventListener("credits-updated", handleRefresh); // Add credits-updated event

    return () => {
      window.removeEventListener("subscription-status-refresh", handleRefresh);
      window.removeEventListener("auth-refresh", handleRefresh);
      window.removeEventListener("credits-updated", handleRefresh);
    };
  }, [queryClient, session?.user?.id]);

  const { data, isLoading, error } = useQuery<SubscriptionStatus>({
    queryKey: ["subscriptionStatus", session?.user?.id],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!session?.user?.id) {
        return {
          subscriptionStatus: null,
          hasActiveTrial: false,
          paypalSubscriptionId: null,
          isPremium: false,
          credits: 0,
          referralCode: null,
        };
      }

      const response = await fetch("/api/paypal/subscription-status", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        // If not authenticated or error, return default
        return {
          subscriptionStatus: null,
          hasActiveTrial: false,
          paypalSubscriptionId: null,
          isPremium: false,
          credits: 0,
          referralCode: null,
        };
      }

      const data = await response.json();
      return {
        subscriptionStatus: data.subscriptionStatus || null,
        hasActiveTrial: data.hasActiveTrial || false,
        paypalSubscriptionId: data.paypalSubscriptionId || null,
        isPremium: data.isPremium || false,
        credits: data.credits || 0,
        referralCode: data.referralCode || null,
      };
    },
    enabled: authStatus === "authenticated" && !!session?.user?.id,
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnMount: true, // Refetch on mount to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window is focused
  });

  // Combine direct query data with session-based flags for maximum reliability
  const subscriptionData = data as SubscriptionStatus | undefined;
  const isSubscribed = (subscriptionData ? subscriptionData.subscriptionStatus === "ACTIVE" : false) || (session?.user?.isSubscribed || false);
  const hasActiveTrial = (subscriptionData ? subscriptionData.hasActiveTrial : false) || (session?.user?.hasActiveTrial || false);
  const isPremium = isSubscribed || hasActiveTrial;

  // Granular logging for debugging subscription gating
  useEffect(() => {
    if (authStatus === "authenticated") {
      console.log("[useSubscriptionStatus] 🛡️ AUTH STATE:", {
        userId: session?.user?.id,
        isPremium,
        isSubscribed,
        hasActiveTrial,
        subscriptionStatus: subscriptionData?.subscriptionStatus,
        sessionUser: {
          isSubscribed: session?.user?.isSubscribed,
          hasActiveTrial: session?.user?.hasActiveTrial,
          trialEndDate: session?.user?.trialEndDate
        }
      });
    }
  }, [isPremium, isSubscribed, hasActiveTrial, subscriptionData, session, authStatus]);

  // For unauthenticated users, immediately return default values (not loading)
  if (authStatus === "unauthenticated") {
    return {
      subscriptionStatus: null,
      hasActiveTrial: false,
      isSubscribed: false,
      isPremium: false,
      paypalSubscriptionId: null,
      credits: 0,
      referralCode: null,
      isLoading: false, // Not loading for unauthenticated users
      error: null,
    };
  }

  return {
    subscriptionStatus: subscriptionData?.subscriptionStatus || null,
    hasActiveTrial,
    isSubscribed,
    isPremium,
    credits: subscriptionData?.credits || 0,
    referralCode: subscriptionData?.referralCode || null,
    paypalSubscriptionId: subscriptionData?.paypalSubscriptionId || null,
    // Only show loading if auth is loading OR subscription query is loading
    isLoading:
      authStatus === "loading" || (authStatus === "authenticated" && isLoading),
    error,
  };
}
