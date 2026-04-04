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
    router.push(`/alerts/edit/${id}`);
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
      {!isPremium && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-blue-100 p-2 sm:p-2.5 rounded-full">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold text-blue-900 font-primary">
                Free Plan: 1 Active Alert
              </p>
              <p className="text-xs sm:text-sm text-blue-700 font-primary">
                You currently get 1 free alert. Subscribe to unlock unlimited alerts and instant notifications.
              </p>
            </div>
          </div>
          <Link href="/pricing" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors font-primary whitespace-nowrap">
              Upgrade Now
            </button>
          </Link>
        </div>
      )}

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
