import { useAppMode } from "@/app/context/AppModeContext";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { useSession } from "next-auth/react";

/**
 * Utility hook to determine if content should be gated
 * @returns Object with gating status and helper functions
 */
export function useContentGating() {
  const { data: session } = useSession();
  const { isSubscribed, hasActiveTrial } = useSubscription();
  const { isBetaMode } = useAppMode();

  // User is not logged in
  const isLoggedOut = !session?.user;

  // Content should be gated if:
  // 1. Not in beta mode AND
  // 2. User is not subscribed AND
  // 3. User doesn't have an active trial
  const isGated = !isBetaMode && !isSubscribed && !hasActiveTrial;

  // Specific gating for logged out users (even in beta mode)
  const isLoggedOutGated = isLoggedOut && !isBetaMode;

  return {
    isGated,
    isLoggedOut,
    isLoggedOutGated,

    // Helper function to render gated content
    renderGatedContent: (
      content: React.ReactNode,
      gatedFallback: React.ReactNode
    ) => {
      return isGated ? gatedFallback : content;
    },

    // Helper for emoji display
    getGatedEmoji: (originalEmoji: string) => {
      return isGated ? "💩" : originalEmoji;
    },

    // Helper for tooltip text
    getGatedTooltip: (originalTooltip: string) => {
      return isGated ? "Subscribe to unlock premium features" : originalTooltip;
    },

    // Helper for blurred content
    getBlurClass: () => {
      return isGated ? "filter blur-sm" : "";
    },
  };
}
