"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    // Sync subscription status from PayPal immediately
    const syncSubscription = async () => {
      try {
        setIsSyncing(true);
        setSyncError(null);

        // Extract subscription_id from URL if present
        const subscriptionId = searchParams.get("subscription_id");
        if (subscriptionId) {
          console.log(
            "[CheckoutSuccess] PayPal subscription_id:",
            subscriptionId
          );
        }

        // Call sync endpoint to check PayPal subscription status
        const response = await fetch("/api/paypal/sync", {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to sync subscription");
        }

        const data = await response.json();
        console.log("[CheckoutSuccess] Subscription synced:", data);

        // Force refresh auth state by triggering a custom event
        // This will cause useBackendAuth to refetch
        window.dispatchEvent(new Event("auth-refresh"));

        // Also refresh the page data
        router.refresh();

        // Small delay to ensure state is updated
        setTimeout(() => {
          setIsSyncing(false);
        }, 1000);
      } catch (error) {
        console.error("[CheckoutSuccess] Sync error:", error);
        setSyncError(
          error instanceof Error ? error.message : "Failed to sync subscription"
        );
        setIsSyncing(false);

        // Still refresh after a delay even if sync fails
        // The webhook might have already updated the status
        setTimeout(() => {
          router.refresh();
        }, 2000);
      }
    };

    syncSubscription();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isSyncing
              ? "Activating Subscription..."
              : "Subscription Activated!"}
          </h1>
          <p className="text-gray-600 mb-8">
            {isSyncing
              ? "Please wait while we activate your premium subscription..."
              : syncError
                ? `Subscription created, but sync failed: ${syncError}. The webhook will update your status shortly.`
                : "Your premium subscription has been activated. You now have access to unlimited alerts and all premium features."}
          </p>

          <div className="space-y-4">
            <Link href="/alerts">
              <Button className="w-full bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90 text-white font-primary">
                Go to Alerts
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full font-primary">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
