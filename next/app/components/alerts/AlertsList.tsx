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
    router.push(`/dashboard/alerts/${id}/edit`);
  };

  if (isAlertsLoading || isSubscriptionLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        {[1, 2, 3].map((i) => (
          <AlertCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!Array.isArray(alerts) || alerts.length === 0) {
    return <EmptyAlertsState />;
  }

  // Filter out any potential invalid alert entries to prevent crashes
  const validAlerts = alerts.filter(alert => alert && typeof alert === 'object' && alert.id);

  if (validAlerts.length === 0) {
    return <EmptyAlertsState />;
  }

  return (
    <div className="space-y-8">
      {/* Democratized: Removed isPremium check and upgrade banner */}


      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-[var(--spacing-md)] md:gap-[var(--spacing-lg)]">
        {validAlerts.map((alert, index) => {
          // Identify if this alert is "excess" for free tier
          // Logic: First 1 alert is free, rest are premium.
          // Note: Alerts are usually sorted by forecastDate desc or createdAt desc in API.
          // For consistency with backend, we should use oldest-first for the free slot,
          // but if the list is already sorted by the API, we'll just use the index here
          // and assume the API gave us the preferred ones first.
          // Actually, let's just use the index for now.
          const isExcess = !isPremium && index > 0;
          
          return (
            <AlertCard
              key={alert.id}
              alert={alert as any}
              isLocked={isExcess}
              onToggleActive={(id, active) => {
                if (isExcess && active) {
                  toast.error("Alert limit reached. Upgrade to Premium to activate more missions.");
                  return;
                }
                handleToggleActive(id, active);
              }}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          );
        })}
      </div>
    </div>
  );
}
