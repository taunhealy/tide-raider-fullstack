"use client";

import { createContext, useContext } from "react";
import { useBackendAuth } from "../hooks/useBackendAuth";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  isSubscribed?: boolean;
  hasActiveTrial?: boolean;
  trialEndDate?: Date | null;
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
  // Use useBackendAuth which already proxies to backend via /api/auth/me
  const { data: session, status } = useBackendAuth();

  const isSubscribed = session?.user?.isSubscribed || false;
  const hasActiveTrial = session?.user?.hasActiveTrial || false;
  const isLoading = status === "loading";

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
