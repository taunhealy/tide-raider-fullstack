"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { Button } from "@/app/components/ui/Button";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useBackendAuth();
  const {
    isSubscribed,
    hasActiveTrial,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    null
  );

  // Log subscription status for debugging
  useEffect(() => {
    console.log("[CheckoutPage] Subscription status check:", {
      authStatus: status,
      isSubscribed,
      hasActiveTrial,
      subscriptionLoading,
      sessionUser: session?.user,
      userId: session?.user?.id,
      userIsSubscribed: session?.user?.isSubscribed,
      userHasActiveTrial: session?.user?.hasActiveTrial,
    });
  }, [status, isSubscribed, hasActiveTrial, subscriptionLoading, session]);

  // Check subscription status directly from API
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const checkSubscription = async () => {
        try {
          const response = await fetch("/api/paypal/subscription-status", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setSubscriptionStatus(data.subscriptionStatus);
            console.log("[CheckoutPage] Direct subscription check:", {
              subscriptionStatus: data.subscriptionStatus,
              isPremium: data.isPremium,
              paypalSubscriptionId: data.paypalSubscriptionId,
            });
          }
        } catch (error) {
          console.error("[CheckoutPage] Error checking subscription:", error);
        }
      };
      checkSubscription();
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout");
    }
  }, [status, router]);

  // Redirect if already subscribed (check both context and direct API)
  useEffect(() => {
    const hasActiveSubscription =
      isSubscribed || hasActiveTrial || subscriptionStatus === "ACTIVE";

    console.log("[CheckoutPage] Redirect check:", {
      hasActiveSubscription,
      isSubscribed,
      hasActiveTrial,
      subscriptionStatus,
      authStatus: status,
    });

    if (status === "authenticated" && hasActiveSubscription) {
      console.log(
        "[CheckoutPage] Redirecting to dashboard - user has active subscription"
      );
      router.push("/dashboard?tab=billing");
    }
  }, [status, isSubscribed, hasActiveTrial, subscriptionStatus, router]);

  const handleCheckout = async () => {
    if (!session?.user) {
      setError("Please sign in to continue");
      return;
    }

    // Double-check subscription status before proceeding
    const hasActiveSubscription =
      isSubscribed || hasActiveTrial || subscriptionStatus === "ACTIVE";

    console.log("[CheckoutPage] Pre-checkout subscription check:", {
      isSubscribed,
      hasActiveTrial,
      subscriptionStatus,
      hasActiveSubscription,
    });

    if (hasActiveSubscription) {
      console.log("[CheckoutPage] Blocking checkout - user already subscribed");
      setError("You already have an active subscription!");
      router.push("/dashboard?tab=billing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.error ||
            "Failed to create subscription"
        );
      }

      const data = await response.json();

      if (data.approvalUrl) {
        // Redirect to PayPal for payment
        window.location.href = data.approvalUrl;
      } else {
        throw new Error("No approval URL received from PayPal");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-tertiary)]/30 border-t-[var(--color-tertiary)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  // Show message if already subscribed (while redirecting)
  const hasActiveSubscription =
    isSubscribed || hasActiveTrial || subscriptionStatus === "ACTIVE";

  if (hasActiveSubscription) {
    console.log("[CheckoutPage] Showing 'already subscribed' message");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-900 mb-4">
            You already have an active subscription!
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Status:{" "}
            {subscriptionStatus || (isSubscribed ? "Subscribed" : "Trial")}
          </p>
          <Button onClick={() => router.push("/dashboard?tab=billing")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upgrade to Premium
          </h1>
          <p className="text-gray-600 mb-8">
            Get unlimited alerts and access to all premium features
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-gray-900 font-medium">Up to 300 Alerts</p>
                <p className="text-gray-600 text-sm">
                  Create as many alerts as you need
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-gray-900 font-medium">Premium Features</p>
                <p className="text-gray-600 text-sm">
                  Access to all premium surf spot data
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0"></div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-[var(--color-tertiary)]/10 border border-[var(--color-tertiary)]/20 rounded-lg p-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">$3</p>
              <p className="text-sm text-gray-600">per month</p>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90 text-white font-primary"
          >
            {loading ? "Processing..." : "Subscribe with PayPal"}
          </Button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Secure payment powered by PayPal. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
