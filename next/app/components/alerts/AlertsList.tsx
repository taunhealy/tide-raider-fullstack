"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { EmptyAlertsState } from "@/app/components/ui/EmptyAlertsState";

import api from "@/app/lib/api-client";
import {
  Alert,
  AlertProperty,
} from "@/app/types/alerts";
import { AlertCard } from "./AlertCard";
import { PropertyDisplay } from "./AlertProperties";
import { AlertCardSkeleton } from "./AlertCardSkeleton";

type AlertTab = "all" | "variable" | "rating";

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
      return api.getAlerts();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

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

  const toggleActiveMutation = useMutation<
    void,
    Error,
    { alertId: string; active: boolean }
  >({
    mutationFn: async ({ alertId, active }) => {
      return api.patchAlert(alertId, { active });
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
      if (activeTab === "variable") return alert.alertType === "VARIABLES";
      if (activeTab === "rating") return alert.alertType === "RATING";
      return true;
    }) ?? [];

  if (!isLoading && !error && filteredAlerts.length === 0 && activeTab === "all") {
    return <EmptyAlertsState />;
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full text-sm font-primary border transition-colors flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-[var(--color-tertiary)] text-black border-transparent font-medium shadow-sm"
                : "bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-light)]"
            }`}
          >
            All Alerts
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "all"
                  ? "bg-black/10 text-black"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
              }`}
            >
              {alerts?.length ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("variable")}
            className={`px-4 py-2 rounded-full text-sm font-primary border transition-colors flex items-center gap-2 ${
              activeTab === "variable"
                ? "bg-[var(--color-tertiary)] text-black border-transparent font-medium shadow-sm"
                : "bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-light)]"
            }`}
          >
            Variable Alerts
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "variable"
                  ? "bg-black/10 text-black"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
              }`}
            >
              {alerts?.filter((a) => a.alertType === "VARIABLES").length ?? 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rating")}
            className={`px-4 py-2 rounded-full text-sm font-primary border transition-colors flex items-center gap-2 ${
              activeTab === "rating"
                ? "bg-[var(--color-tertiary)] text-black border-transparent font-medium shadow-sm"
                : "bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-light)]"
            }`}
          >
            Rating Alerts
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "rating"
                  ? "bg-black/10 text-black"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
              }`}
            >
              {alerts?.filter((a) => a.alertType === "RATING").length ?? 0}
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
