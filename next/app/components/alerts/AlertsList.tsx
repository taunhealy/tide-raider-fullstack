"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCard } from "./AlertCard";
import { AlertCardSkeleton } from "./AlertCardSkeleton";
import { EmptyAlertsState } from "@/app/components/ui/EmptyAlertsState";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Bell, Shield } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/app/types/alerts";

export function AlertsList() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isPremium, isLoading: isSubscriptionLoading } = useSubscriptionStatus();

  const { data: alerts, isLoading: isAlertsLoading } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await fetch("/api/alerts", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      return response.json();
    },
  });

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success(active ? "Alert activated" : "Alert deactivated");
    } catch (error) {
      toast.error("Failed to update alert");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;

    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }

      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert deleted successfully");
    } catch (error) {
      toast.error("Failed to delete alert");
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/alerts/${id}/edit`);
  };

  if (isAlertsLoading || isSubscriptionLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <AlertCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return <EmptyAlertsState />;
  }

  return (
    <div className="space-y-8">
      {/* Democratized: Removed isPremium check and upgrade banner */}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert as any}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>
    </div>
  );
}
