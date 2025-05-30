"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DeleteAdButton({ adId }: { adId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to ad details
    e.stopPropagation(); // Stop event propagation

    if (
      !confirm(
        "Are you sure you want to delete this ad? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/advertising/ads?id=${adId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete ad");
      }

      toast.success("Ad deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast.error("Failed to delete ad");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isLoading}
      className="text-red-600 hover:text-red-800 font-medium text-sm"
    >
      {isLoading ? "Deleting..." : "Delete"}
    </button>
  );
}
