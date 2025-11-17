"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ForecastAlertModal from "@/app/components/alerts/ForecastAlertForm";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useAuth } from "@/app/hooks/useAuth";
import { LogEntry } from "@/app/types/raidlogs";
import { Prisma } from "@prisma/client";

interface EditAlertPageClientProps {
  alert: Prisma.AlertCreateInput;
  logEntries: any[]; // LogEntry with relations
}

export function EditAlertPageClient({
  alert,
  logEntries,
}: EditAlertPageClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLogEntry, setSelectedLogEntry] = useState<LogEntry | null>(
    null
  );
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    // If alert has a logEntry, set it as selected
    if (alert.logEntry?.connect?.id && logEntries.length > 0) {
      const logEntry = logEntries.find(
        (entry) => entry.id === alert.logEntry?.connect?.id
      );
      if (logEntry) {
        setSelectedLogEntry(logEntry as LogEntry);
      }
    }
    setIsLoading(false);
  }, [alert, logEntries]);

  // Handle log entry selection from child component
  const handleLogEntrySelect = (logEntry: LogEntry | null) => {
    setSelectedLogEntry(logEntry);
  };

  const handleClose = () => {
    router.push("/alerts");
  };

  const handleAlertSaved = () => {
    router.push("/alerts");
  };

  if (isLoading || isAuthLoading) {
    return <RandomLoader isLoading={true} />;
  }

  return (
    <div>
      <ForecastAlertModal
        isOpen={true}
        onClose={handleClose}
        logEntry={selectedLogEntry}
        existingAlert={alert}
        onSaved={handleAlertSaved}
        isNew={false}
        logEntries={logEntries as LogEntry[]}
        onLogEntrySelect={handleLogEntrySelect}
      />
    </div>
  );
}
