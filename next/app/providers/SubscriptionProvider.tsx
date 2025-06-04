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
      const response = await fetch("/api/subscription/status");
      const data = await response.json();
      setState({
        isSubscribed: data.isSubscribed,
        hasActiveTrial: data.hasActiveTrial,
      });
    } catch (error) {
      console.error("Failed to check subscription:", error);
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
