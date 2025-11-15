"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Alert, AlertProperty, NotificationMethod } from "@/app/types/alerts";
import { AlertType } from "@prisma/client";
import { AlertCard } from "./AlertCard";
import { PropertyDisplay } from "./AlertProperties";
import { AlertCardSkeleton } from "./AlertCardSkeleton";

type AlertTab = "all" | "variable" | "rating";

// Move getUnit outside the AlertsList component to make it accessible to all components
function getUnit(property: AlertProperty["property"]): string {
  switch (property.toLowerCase()) {
    case "windspeed":
      return "kts";
    case "winddirection":
    case "swelldirection":
      return "°";
    case "swellheight":
      return "m";
    case "swellperiod":
      return "s";
    default:
      return "";
  }
}

export function AlertsList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AlertTab>("all");
  const queryClient = useQueryClient();

  const {
    data: alerts,
    isLoading,
    error,
  } = useQuery<Alert[], Error>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await fetch(
        "/api/alerts?include=logEntry.forecast,logEntry.beach,beach"
      );
      if (!response.ok) throw new Error("Failed to fetch alerts");
      return response.json();
    },
    staleTime: 0, // Always consider data stale to allow refetching
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Properly typed mutations
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }
    },
    onSuccess: () => {
      toast.success("Alert deleted");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error("Failed to delete alert", {
        description: error.message,
      });
    },
  });

  // Properly typed toggle mutation
  const toggleActiveMutation = useMutation<
    void,
    Error,
    { alertId: string; active: boolean }
  >({
    mutationFn: async ({ alertId, active }) => {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!response.ok) {
        throw new Error("Failed to update alert");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error) => {
      toast.error("Failed to update alert", {
        description: error.message,
      });
    },
  });

  const handleToggleActive = (alertId: string, active: boolean) => {
    toggleActiveMutation.mutate({ alertId, active });
  };

  const handleDelete = (alertId: string) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteMutation.mutate(alertId);
    }
  };

  const handleEdit = (alertId: string) => {
    router.push(`/alerts/${alertId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <AlertCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 border rounded-lg bg-[var(--color-bg-primary)]">
        <h3 className="mt-4 text-lg font-medium font-primary text-[var(--color-text-primary)]">
          Error loading alerts
        </h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)] font-primary">
          {error instanceof Error ? error.message : "An unknown error occurred"}
        </p>
      </div>
    );
  }

  const filteredAlerts =
    alerts?.filter((alert) => {
      if (activeTab === "all") return true;
      if (activeTab === "variable")
        return alert.alertType === AlertType.VARIABLES;
      if (activeTab === "rating") return alert.alertType === AlertType.RATING;
      return true;
    }) ?? [];

  return (
    <>
      <div className="mb-6 border-b border-[var(--color-border-light)]">
        <div className="flex space-x-4 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-3 px-2 sm:px-4 font-primary text-xs sm:text-sm ${
              activeTab === "all"
                ? "border-b-2 border-[var(--color-alert-tab-active)] text-[var(--color-alert-tab-active)] font-medium"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            All Alerts
            <span className="ml-1 sm:ml-2 text-xs bg-[var(--color-bg-secondary)] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {alerts?.length ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("variable")}
            className={`py-3 px-2 sm:px-4 font-primary text-xs sm:text-sm ${
              activeTab === "variable"
                ? "border-b-2 border-[var(--color-alert-tab-active)] text-[var(--color-alert-tab-active)] font-medium"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Variable Alerts
            <span className="ml-1 sm:ml-2 text-xs bg-[var(--color-bg-secondary)] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {alerts?.filter((a) => a.alertType === AlertType.VARIABLES)
                .length ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rating")}
            className={`py-3 px-2 sm:px-4 font-primary text-xs sm:text-sm ${
              activeTab === "rating"
                ? "border-b-2 border-[var(--color-alert-tab-active)] text-[var(--color-alert-tab-active)] font-medium"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Rating Alerts
            <span className="ml-1 sm:ml-2 text-xs bg-[var(--color-bg-secondary)] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {alerts?.filter((a) => a.alertType === AlertType.RATING).length ??
                0}
            </span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>
    </>
  );
}

// Break out into components for better organization
function AlertProperties({ properties }: { properties: AlertProperty[] }) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <p className="font-medium mb-2">Alert Triggers When:</p>
      <div className="flex flex-wrap gap-2">
        {properties.map((prop, index) => (
          <PropertyDisplay key={index} property={prop} />
        ))}
      </div>
    </div>
  );
}
