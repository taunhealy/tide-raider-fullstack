"use client";

import { Button } from "../components/ui/Button";
import { useHandleSubscribe } from "../hooks/useHandleSubscribe";
import { Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Image from "next/image";
import { client } from "@/app/lib/sanity";
import { pricingQuery } from "@/app/lib/queries";
import { useEffect, useState } from "react";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "sonner";
import { useSubscriptionDetails } from "../hooks/useSubscriptionDetails";
import { SubscriptionStatus } from "@/app/types/subscription";

function ImageSkeleton() {
  return (
    <div className="relative w-[510px] h-[340px] overflow-hidden rounded-md bg-gray-200 animate-pulse">
      <div
        className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"
        style={{
          backgroundSize: "400% 100%",
        }}
      />
    </div>
  );
}

interface PricingData {
  title: string;
  subtitle: string;
  pricingImage: string;
  price: number;
  priceSubtext: string;
  features: string[];
}

export default function PricingPage() {
  const handleSubscribe = useHandleSubscribe();
  const [data, setData] = useState<PricingData | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const { isSubscribed, hasActiveTrial, trialStatus } = useSubscription();
  const [loadingStates, setLoadingStates] = useState({
    subscribe: false,
    unsubscribe: false,
  });
  const { data: subscriptionDetails } = useSubscriptionDetails();
  const isActiveSubscription =
    subscriptionDetails?.status === SubscriptionStatus.ACTIVE;
  const subscriptionData = subscriptionDetails;

  useEffect(() => {
    const fetchData = async () => {
      const pricingData = await client.fetch(pricingQuery);
      setData(pricingData);
    };
    fetchData();
  }, []);

  const handleSubscribeWithLoading = async () => {
    setLoadingStates((prev) => ({ ...prev, subscribe: true }));
    try {
      // If eligible for trial, start trial
      if (
        !subscriptionData?.hasTrialEnded &&
        !subscriptionData?.hasActiveTrial
      ) {
        const response = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start-trial",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start trial");
        }

        // Refresh the page after successful trial start
        window.location.reload();
        return;
      }

      // Otherwise, create PayPal subscription
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
        }),
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Subscription action failed:", error);
      toast.error("Failed to process request. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, subscribe: false }));
    }
  };

  const handleUnsubscribe = async () => {
    setLoadingStates((prev) => ({ ...prev, unsubscribe: true }));
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          subscriptionId: subscriptionData?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Failed to unsubscribe. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, unsubscribe: false }));
    }
  };

  const getButtonText = () => {
    if (loadingStates.subscribe) return "Processing...";
    if (loadingStates.unsubscribe) return "Cancelling...";

    // If subscription is active, show unsubscribe
    if (subscriptionDetails?.status === SubscriptionStatus.ACTIVE) {
      return "Unsubscribe";
    }

    // If trial has ended, show Subscribe Now
    if (subscriptionDetails?.hasTrialEnded) {
      return "Subscribe Now";
    }

    // If trial is active, show Subscribe Now
    if (subscriptionDetails?.hasActiveTrial) {
      return "Subscribe Now";
    }

    // Default to Start Free Trial
    return "Start Free Trial";
  };

  return (
    <div className="bg-[var(--color-bg-primary)]">
      <div className="container px-4 md:pl-[81px] py-8 md:py-[54px]">
        <div className="md:pl-[54px]">
          <div className="mb-8 md:mb-[54px] border-b border-[var(--color-border-light)] pb-5 md:pb-[54px]">
            <h3 className="heading-3 text-[var(--color-text-primary)] mb-4 md:mb-[16px]">
              Simple, transparent pricing
            </h3>
            <p className="text-large text-[var(--color-text-secondary)] text-left">
              Get unlimited access to Alerts features.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-[54px] items-center md:items-start">
            <div className="w-full md:max-w-[540px] bg-[var(--color-bg-secondary)] roundfed-md shadow-sm border border-[var(--color-border-light)] overflow-hidden">
              <div className="px-[32px] py-[32px] bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-light)]">
                <h5
                  className={cn(
                    "text-[var(--color-text-primary)] mb-[8px] font-primary"
                  )}
                >
                  Tide Raider Membership
                </h5>
                <div className="flex items-baseline gap-[8px]">
                  <span
                    className={cn(
                      "text-[32px] font-semibold text-[var(--color-text-primary)] font-primary"
                    )}
                  >
                    R30
                  </span>
                  <span className="text-main text-[var(--color-text-secondary)]">
                    per month
                  </span>
                </div>
              </div>

              <div className="px-[32px] py-[32px] bg-white">
                <ul className="space-y-[16px] mb-[32px]">
                  {[
                    "Set alerts to get notifications for your ideal surf conditions (SMS/App/Email)",
                    "Cancel anytime",
                    "14-day free trial",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className={cn("flex items-start gap-[8px]")}
                    >
                      <Check className="h-5 w-5 text-[var(--color-text-primary)] mt-[2px]" />
                      <span className="text-main text-[var(--color-text-secondary)] font-primary">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className={cn("w-full font-primary")}
                    onClick={
                      isSubscribed
                        ? handleUnsubscribe
                        : handleSubscribeWithLoading
                    }
                    disabled={
                      loadingStates.subscribe || loadingStates.unsubscribe
                    }
                  >
                    {getButtonText()}
                  </Button>
                </div>
              </div>
            </div>

            {data?.pricingImage ? (
              <div className="relative w-full md:w-[510px] h-[240px] md:h-[340px] overflow-hidden rounded-md">
                <div className="absolute inset-0 bg-[var(--color-tertiary)]" />
                <Image
                  src={data.pricingImage}
                  alt="Surfing waves"
                  fill
                  className="object-cover opacity-70"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJiEkKic0Ly4vLy4vNDk2ODU4Ni8vQUFBQC8vRUVFRUVFRUVFRUVFRUX/2wBDAR0XFyAeIB4gHh4gIB4lICAgICUmJSAgICUvJSUlJSUlLyUlJSUlJSUlJSUlJSUlJSUlJSUlJSX/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
              </div>
            ) : (
              <div className="relative w-full md:w-[510px] h-[240px] md:h-[340px] overflow-hidden rounded-md bg-gray-200">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer"
                  style={{
                    backgroundSize: "400% 100%",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
