"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlertConfig } from "@/app/types/alerts";
import { AlertType } from "@prisma/client";
import { AlertConfigTypes } from "@/app/types/alerts";
import { AlertsList } from "@/app/components/alerts/AlertsList";
import { Button } from "@/app/components/ui/Button";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load alerts from localStorage or API
    const savedAlerts = localStorage.getItem("userAlerts");
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  const saveAlertsToStorage = (updatedAlerts: AlertConfig[]) => {
    localStorage.setItem("userAlerts", JSON.stringify(updatedAlerts));
    setAlerts(updatedAlerts);
  };

  const handleCreateNewAlert = () => {
    // Redirect to the new alert page
    router.push(`/alerts/new`);
  };

  const handleSaveAlert = async (alertConfig: AlertConfig) => {
    let updatedAlerts: AlertConfig[];
    try {
      if (editingAlertId) {
        // Update existing alert
        updatedAlerts = alerts.map((alert) =>
          alert.id === editingAlertId
            ? { ...alertConfig, id: editingAlertId }
            : alert
        );

        toast.success(`Alert "${alertConfig.name}" updated`, {
          description: "Your alert has been updated successfully.",
        });
      } else {
        // Create new alert
        const newAlert = {
          ...alertConfig,
          id: uuidv4(),
        };

        updatedAlerts = [...alerts, newAlert];
        toast.success(`Alert "${alertConfig.name}" created`, {
          description: "Your alert has been created successfully.",
        });
      }

      saveAlertsToStorage(updatedAlerts);
      setIsCreating(false);
      setEditingAlertId(null);
    } catch (error) {
      console.error("Error saving alert:", error);
      toast.error("Failed to save alert. Please try again.");
    }
  };

  const handleEditAlert = (alertId: string) => {
    router.push(`/alerts/${alertId}`);
  };

  const handleDeleteAlert = (alertId: string) => {
    const alertToDelete = alerts.find((alert) => alert.id === alertId);
    const updatedAlerts = alerts.filter((alert) => alert.id !== alertId);
    saveAlertsToStorage(updatedAlerts);

    toast.success(`Your alert "${alertToDelete?.name}" has been deleted.`);
  };

  const handleToggleActive = (alertId: string, active: boolean) => {
    const updatedAlerts = alerts.map((alert) =>
      alert.id === alertId ? { ...alert, active } : alert
    );
    saveAlertsToStorage(updatedAlerts);

    const alertName = alerts.find((alert) => alert.id === alertId)?.name;
    toast.success(
      `Your alert "${alertName}" has been ${active ? "activated" : "deactivated"}.`
    );
  };

  // Add a section that summarizes alerts by type
  const alertSummary = useMemo(() => {
    if (!alerts) return { variables: 0, rating: 0 };

    return alerts.reduce(
      (acc, alert) => {
        if (alert.alertType === AlertType.RATING) {
          acc.rating += 1;
        } else {
          acc.variables += 1;
        }
        return acc;
      },
      { variables: 0, rating: 0 }
    );
  }, [alerts]);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-primary text-primary">
          Forecast Alerts
        </h1>
        <Button onClick={handleCreateNewAlert} className="font-primary">
          Create New Alert
        </Button>
      </div>

      <div>
        <p className="text-muted-foreground mb-8 font-primary text-lg">
          Set up personalized alerts to get notified when surf conditions match
          your preferences.
        </p>
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <AlertsList />
        </div>
      </div>
    </div>
  );
}
