"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RentalRequestActionsProps {
  requestId: string;
  status: string;
  isRenter: boolean;
}

export function RentalRequestActions({
  requestId,
  status,
  isRenter,
}: RentalRequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateRequestStatus = async (newStatus: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/rental-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update request");
      }

      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error("Error updating request:", error);
      setError(error instanceof Error ? error.message : "Failed to update request");
    } finally {
      setLoading(false);
    }
  };

  // No actions for completed or cancelled requests
  if (
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "REJECTED"
  ) {
    return null;
  }

  return (
    <div className="border-t pt-4 mt-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Owner actions */}
        {!isRenter && status === "PENDING" && (
          <>
            <button
              onClick={() => updateRequestStatus("APPROVED")}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Processing..." : "Approve Request"}
            </button>

            <button
              onClick={() => updateRequestStatus("REJECTED")}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? "Processing..." : "Reject Request"}
            </button>
          </>
        )}

        {/* Renter actions */}
        {isRenter && (status === "PENDING" || status === "APPROVED") && (
          <button
            onClick={() => updateRequestStatus("CANCELLED")}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? "Processing..." : "Cancel Request"}
          </button>
        )}

        {/* Complete action (both parties can mark as completed) */}
        {status === "APPROVED" && (
          <button
            onClick={() => updateRequestStatus("COMPLETED")}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Processing..." : "Mark as Completed"}
          </button>
        )}
      </div>
    </div>
  );
}
