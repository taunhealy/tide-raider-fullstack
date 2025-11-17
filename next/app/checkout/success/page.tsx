"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Refresh user data to get updated subscription status
    // The webhook should have updated the user's subscription
    setTimeout(() => {
      router.refresh();
    }, 2000);
  }, [router]);

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
            Subscription Activated!
          </h1>
          <p className="text-gray-600 mb-8">
            Your premium subscription has been activated. You now have access to
            unlimited alerts and all premium features.
          </p>

          <div className="space-y-4">
            <Link href="/alerts">
              <Button className="w-full bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90 text-white font-primary">
                Go to Alerts
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="w-full font-primary"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

