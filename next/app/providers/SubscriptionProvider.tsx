"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface SubscriptionState {
  isSubscribed: boolean;
  hasActiveTrial: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    hasActiveTrial: false,
  });

  const checkSubscription = async () => {
    try {
      console.log("[SubscriptionProvider] Fetching subscription status...");
      const response = await fetch("/api/subscription/status");
      
      if (!response.ok) {
        console.error("[SubscriptionProvider] Error response:", response.status);
        return;
      }
      
      const data = await response.json();
      console.log("[SubscriptionProvider] Subscription data received:", data);
      
      setState({
        isSubscribed: data.isSubscribed || false,
        hasActiveTrial: data.hasActiveTrial || false,
      });
      
      console.log("[SubscriptionProvider] State updated:", {
        isSubscribed: data.isSubscribed || false,
        hasActiveTrial: data.hasActiveTrial || false,
      });
    } catch (error) {
      console.error("[SubscriptionProvider] Failed to check subscription:", error);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider value={{ ...state, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
