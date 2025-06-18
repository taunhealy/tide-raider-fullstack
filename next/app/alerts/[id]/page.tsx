"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import ForecastAlertModal from "@/app/components/alerts/ForecastAlertModal";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { AlertConfig } from "@/app/types/alerts";
import { useQuery } from "@tanstack/react-query";

export default function AlertPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const alertId = params?.id as string;
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Fetch the alert data
  const { data: alert, isLoading } = useQuery({
    queryKey: ["alert", alertId],
    queryFn: async () => {
      if (!alertId || alertId === "new") return null;

      const response = await fetch(
        `/api/alerts/${alertId}?include=logEntry.forecast,logEntry.beach`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch alert");
      }
      return response.json();
    },
    enabled: !!alertId && alertId !== "new" && !!session,
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      toast.error("Please log in to edit alerts");
      router.push("/");
    }
  }, [session, status, router]);

  const handleClose = () => {
    setIsModalOpen(false);
    router.push("/alerts");
  };

  const handleSaved = () => {
    toast.success("Alert updated successfully");
    router.push("/alerts");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <RandomLoader isLoading={true} />
        <p className="mt-4 text-gray-600 font-primary">Loading alert...</p>
      </div>
    );
  }

  if (!alert && alertId !== "new") {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-primary mb-4">Alert not found</h2>
        <button
          onClick={() => router.push("/alerts")}
          className="px-4 py-2 bg-blue-500 text-white rounded-md font-primary"
        >
          Return to Alerts
        </button>
      </div>
    );
  }

  return (
    <ForecastAlertModal
      isOpen={isModalOpen}
      onClose={handleClose}
      logEntry={alert?.logEntry || null}
      existingAlert={alert}
      onSaved={handleSaved}
      isNew={alertId === "new"}
    />
  );
}
