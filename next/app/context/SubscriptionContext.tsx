"use client";

import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";
import { Session } from "next-auth";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionStatus } from "@/app/types/subscription";

interface SubscriptionContextType {
  isSubscribed: boolean;
  hasActiveTrial: boolean;
  trialStatus: "active" | "ended" | "available";
  isLoading: boolean;
  session: Session | null;
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
  const { session, isLoading: sessionLoading } = useAuth();

  const { data, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription-state"],
    queryFn: async () => {
      const userRes = await fetch("/api/user/current");
      const userData = await userRes.json();

      return {
        user: userData,
      };
    },
    enabled: !!session?.user,
  });

  const isSubscribed =
    data?.user?.subscriptionStatus === SubscriptionStatus.ACTIVE;

  console.log("Final subscription check:", {
    status: data?.user?.subscriptionStatus,
    enumValue: SubscriptionStatus.ACTIVE,
    isMatch: data?.user?.subscriptionStatus === SubscriptionStatus.ACTIVE,
    isSubscribed,
  });

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        hasActiveTrial: Boolean(data?.user?.hasActiveTrial),
        trialStatus: data?.user?.hasActiveTrial ? "active" : "ended",
        isLoading: sessionLoading || subscriptionLoading,
        session,
        trialEndDate: data?.user?.trialEndDate,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
