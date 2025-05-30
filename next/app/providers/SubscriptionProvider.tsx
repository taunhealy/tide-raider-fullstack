"use client";

import { createContext, useContext, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setUserStatus } from "../redux/slices/userSlice";
import { RootState } from "../redux/store";

// Keep the context for backward compatibility
export const SubscriptionContext = createContext({
  isSubscribed: false,
  hasActiveTrial: false,
});

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      // Check subscription status from session or API
      const checkSubscription = async () => {
        try {
          const response = await fetch("/api/subscription/status");
          const data = await response.json();

          dispatch(
            setUserStatus({
              isSubscribed: data.isSubscribed,
              hasActiveTrial: data.hasActiveTrial,
            })
          );
        } catch (error) {
          console.error("Failed to fetch subscription status:", error);
        }
      };

      checkSubscription();
    } else {
      // Reset subscription state when logged out
      dispatch(
        setUserStatus({
          isSubscribed: false,
          hasActiveTrial: false,
        })
      );
    }
  }, [session, dispatch]);

  // The provider doesn't need to provide values anymore
  // as components will get the data from Redux
  return (
    <SubscriptionContext.Provider
      value={{ isSubscribed: false, hasActiveTrial: false }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// This hook now uses Redux instead of context
export function useSubscription() {
  const { isSubscribed, hasActiveTrial } = useAppSelector(
    (state: RootState) =>
      state.user as { isSubscribed: boolean; hasActiveTrial: boolean }
  );
  return { isSubscribed, hasActiveTrial };
}
