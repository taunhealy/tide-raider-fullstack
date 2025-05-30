"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CancelAdSubscriptionButton({ adId }: { adId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this advertisement subscription?"
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/advertising/ads?id=${adId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast.success("Subscription cancelled successfully");
      router.refresh();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isLoading}
      className="w-full btn-filter-inactive disabled:opacity-50"
    >
      {isLoading ? "Cancelling..." : "Cancel Subscription"}
    </button>
  );
}
