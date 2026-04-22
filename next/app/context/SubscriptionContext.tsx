"use client";

import { createContext, useContext, useEffect } from "react";
import { useBackendAuth } from "../hooks/useBackendAuth";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isSubscribed?: boolean;
  subscriptionStatus?: string;
  hasActiveTrial?: boolean;
  trialEndDate?: Date | null;
  whatsappNumber?: string | null;
  referralCode?: string;
}

interface BackendSession {
  user: User;
}

interface SubscriptionContextType {
  isSubscribed: boolean;
  hasActiveTrial: boolean;
  trialStatus: "active" | "ended" | "available";
  isLoading: boolean;
  session: BackendSession | null;
  trialEndDate?: Date | null;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  hasActiveTrial: false,
  trialStatus: "available",
  isLoading: true,
  session: null,
  trialEndDate: null,
});

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, refetch } = useBackendAuth();

  // Listen for auth refresh events
  useEffect(() => {
    const handleAuthRefresh = () => {
      refetch();
    };

    window.addEventListener("auth-refresh", handleAuthRefresh);
    return () => {
      window.removeEventListener("auth-refresh", handleAuthRefresh);
    };
  }, [refetch]);

  const isSubscribed = session?.user?.isSubscribed || false;
  const hasActiveTrial = session?.user?.hasActiveTrial || false;
  const isLoading = status === "loading";

  // Log subscription context values for debugging
  useEffect(() => {
    console.log("[SubscriptionContext] Subscription state:", {
      isSubscribed,
      hasActiveTrial,
      isLoading,
      sessionUser: session?.user,
      userId: session?.user?.id,
      userIsSubscribed: session?.user?.isSubscribed,
      userHasActiveTrial: session?.user?.hasActiveTrial,
      trialEndDate: session?.user?.trialEndDate,
    });
  }, [isSubscribed, hasActiveTrial, isLoading, session]);

  // Determine trial status
  const trialStatus = hasActiveTrial
    ? "active"
    : session?.user?.trialEndDate
      ? "ended"
      : "available";

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        hasActiveTrial,
        trialStatus,
        isLoading,
        session,
        trialEndDate: session?.user?.trialEndDate || null,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
