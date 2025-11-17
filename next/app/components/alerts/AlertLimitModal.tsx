"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/Button";

interface AlertLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertLimitModal({ isOpen, onClose }: AlertLimitModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = () => {
    router.push("/checkout");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            Alert Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 pt-2">
            You've used up your free alert. Upgrade to premium for unlimited
            alerts and access to all premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
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
              <div>
                <p className="font-semibold text-gray-900">Up to 300 Alerts</p>
                <p className="text-sm text-gray-600">
                  Create as many alerts as you need
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
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
              <div>
                <p className="font-semibold text-gray-900">Premium Features</p>
                <p className="text-sm text-gray-600">
                  Access to all premium surf spot data
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0"
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
              <div>
                <p className="font-semibold text-gray-900">Priority Support</p>
                <p className="text-sm text-gray-600">
                  Get help when you need it most
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-tertiary)]/10 border border-[var(--color-tertiary)]/20 rounded-lg p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">$3</p>
              <p className="text-sm text-gray-600">per month</p>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90 text-white font-primary"
            >
              {loading ? "Processing..." : "Subscribe with PayPal"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full font-primary"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Secure payment powered by PayPal. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
