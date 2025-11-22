import { useSubscription } from "@/app/context/SubscriptionContext";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";

/**
 * Utility hook to determine if content should be gated
 * @returns Object with gating status and helper functions
 */
export function useContentGating() {
  const { data: session, status: authStatus } = useBackendAuth();
  const { isSubscribed, hasActiveTrial } = useSubscription();

  // User is not logged in
  const isLoggedOut = !session?.user || authStatus === "unauthenticated";

  // Content should be gated if:
  // 1. User is not logged in (allow all logged-in users access)
  // Premium features are now free for all logged-in users
  const isGated = isLoggedOut;

  // Specific gating for logged out users (even in beta mode)
  const isLoggedOutGated = isLoggedOut;

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
