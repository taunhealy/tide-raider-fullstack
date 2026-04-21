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
    queryFn: async () => {
      if (!session?.user?.id) {
        return {
          subscriptionStatus: null,
          hasActiveTrial: false,
          paypalSubscriptionId: null,
          isPremium: false,
          credits: 0,
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
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch on every mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

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

  // For authenticated users, use query data
  const isSubscribed = data?.subscriptionStatus === "ACTIVE";
  const hasActiveTrial = data?.hasActiveTrial || false;
  const isPremium = isSubscribed || hasActiveTrial;

  return {
    subscriptionStatus: data?.subscriptionStatus || null,
    hasActiveTrial,
    isSubscribed,
    isPremium,
    credits: data?.credits || 0,
    referralCode: data?.referralCode || null,
    paypalSubscriptionId: data?.paypalSubscriptionId || null,
    // Only show loading if auth is loading OR subscription query is loading
    isLoading:
      authStatus === "loading" || (authStatus === "authenticated" && isLoading),
    error,
  };
}
