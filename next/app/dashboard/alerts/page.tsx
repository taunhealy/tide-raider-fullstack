"use client";

import PageContainer from "@/app/components/ui/PageContainer";

import React, { useState, useEffect, useMemo } from "react";
import { AlertConfig, AlertType } from "@/app/types/alerts";
import { AlertConfigTypes } from "@/app/types/alerts";
import { AlertsList } from "@/app/components/alerts/AlertsList";
import { Button } from "@/app/components/ui/Button";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { RecentLogsSidebar } from "@/app/components/alerts/RecentLogsSidebar";

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
    router.push(`/dashboard/alerts/new`);
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
    router.push(`/dashboard/alerts/${alertId}`);
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
    <div className="min-h-screen bg-gray-50/50 text-slate-900 font-primary overflow-x-hidden pb-20">
      <PageContainer>
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-16 pt-8">
          <div className="flex-1 space-y-8 min-w-0 p-4 sm:p-6 md:p-8 border border-gray-200 rounded-[32px] md:rounded-[48px] bg-white/30">
            {/* Header Section inside the container */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 px-2">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl brand-icon-wrapper">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-black text-brand-gray uppercase tracking-[0.2em]">AI Alerts</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  Tactical Alerts
                </h1>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Automated triggers for your preferred surf conditions.
                </p>
              </div>

              <Button 
                variant="action"
                size="xl"
                onClick={handleCreateNewAlert}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 shrink-0 shadow-sm font-black uppercase tracking-widest text-[10px] rounded-xl active:scale-95 whitespace-nowrap"
              >
                Create New Alert
              </Button>
            </div>

            <div className="bg-white/40 backdrop-blur-md rounded-[24px] md:rounded-[40px] p-1.5 md:p-6 border border-white/60 shadow-sm">
              <div className="bg-white rounded-[20px] md:rounded-[32px] p-4 sm:p-6 md:p-10 border border-slate-100 min-h-[400px]">
                 <AlertsList />
              </div>
            </div>
          </div>

          <RecentLogsSidebar />
        </div>
      </PageContainer>
    </div>
  );
}
