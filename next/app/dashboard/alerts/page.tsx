"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlertConfig, AlertType } from "@/app/types/alerts";
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-primary overflow-x-hidden pb-20">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 lg:p-12 space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-brand-3 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-3">Condition Monitor</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Tactical <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">Alerts</span>
            </h1>
            <p className="text-slate-500 mt-3 max-w-lg font-medium text-lg">
              Automated triggers for your preferred surf conditions.
            </p>
          </div>

          <Button 
            onClick={handleCreateNewAlert}
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-2"
          >
            Create New Alert
          </Button>
        </header>

        <div className="bg-white/40 backdrop-blur-md rounded-[40px] p-2 md:p-8 border border-white/60 shadow-sm">
          <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-100 min-h-[400px]">
             <AlertsList />
          </div>
        </div>
      </div>
    </div>
  );
}
