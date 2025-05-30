"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ForecastAlertModal from "@/app/components/alerts/ForecastAlertModal";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useSession } from "next-auth/react";
import { LogEntry } from "@/app/types/questlogs";

export default function NewAlertPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [selectedLogEntry, setSelectedLogEntry] = useState<LogEntry | null>(
    null
  );
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // Get the selected log entry from localStorage
    const storedLogEntry = localStorage.getItem("selectedLogEntry");
    if (storedLogEntry) {
      setSelectedLogEntry(JSON.parse(storedLogEntry));
      // Clear the stored entry to prevent it from persisting
      localStorage.removeItem("selectedLogEntry");
    }

    // Fetch log entries when component mounts
    const fetchLogEntries = async () => {
      try {
        const response = await fetch("/api/logs");
        if (response.ok) {
          const data = await response.json();
          setLogEntries(data);
        } else {
          console.error("Failed to fetch log entries");
        }
      } catch (error) {
        console.error("Error fetching log entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchLogEntries();
    } else if (status === "unauthenticated") {
      router.push("/login");
    } else {
      // Simulate loading for a smoother transition
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const handleClose = () => {
    router.push("/dashboard/alerts");
  };

  const handleAlertSaved = () => {
    router.push("/dashboard/alerts");
  };

  if (isLoading) {
    return <RandomLoader isLoading={true} />;
  }

  return (
    <div>
      <ForecastAlertModal
        isOpen={true}
        onClose={handleClose}
        logEntry={selectedLogEntry}
        existingAlert={undefined}
        onSaved={handleAlertSaved}
        isNew={true}
        logEntries={logEntries}
      />
    </div>
  );
}
