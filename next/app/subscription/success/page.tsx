"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Redirect route for PayPal subscription success
 * PayPal sometimes redirects to /subscription/success instead of /checkout/success
 * This route redirects to the correct checkout success page
 */
export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve all query parameters when redirecting
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    const queryString = params.toString();
    const redirectUrl = `/checkout/success${queryString ? `?${queryString}` : ""}`;

    // Redirect to the checkout success page
    router.replace(redirectUrl);
  }, [router, searchParams]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-tertiary)] mx-auto mb-4"></div>
        <p className="text-gray-600 font-primary">Redirecting...</p>
      </div>
    </div>
  );
}
