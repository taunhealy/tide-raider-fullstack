"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-gray-600 mb-8">
            Your subscription was not completed. You can try again anytime.
          </p>

          <div className="space-y-4">
            <Link href="/checkout">
              <Button className="w-full bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90 text-white font-primary">
                Try Again
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

