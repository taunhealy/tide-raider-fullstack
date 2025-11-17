"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ForecastAlertModal from "@/app/components/alerts/ForecastAlertForm";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { LogEntry } from "@/app/types/raidlogs";
import api from "@/app/lib/api-client";

export default function NewAlertPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [selectedLogEntry, setSelectedLogEntry] = useState<LogEntry | null>(
    null
  );
  const [hasFetchedLogs, setHasFetchedLogs] = useState(false);
  const router = useRouter();
  const { data: session, status: authStatus } = useBackendAuth();

  useEffect(() => {
    // Get the selected log entry from localStorage
    const storedLogEntry = localStorage.getItem("selectedLogEntry");
    if (storedLogEntry) {
      setSelectedLogEntry(JSON.parse(storedLogEntry));
      // Clear the stored entry to prevent it from persisting
      localStorage.removeItem("selectedLogEntry");
    }
  }, []); // Only run once on mount

  useEffect(() => {
    // Fetch log entries when component mounts
    let mounted = true;

    const fetchLogEntries = async () => {
      try {
        console.log("[NewAlertPage] Fetching log entries...");
        const data = await api.getLogs();
        console.log("[NewAlertPage] Log entries fetched:", data?.length || 0);
        if (mounted) {
          setLogEntries(Array.isArray(data) ? data : []);
          setHasFetchedLogs(true);
        }
      } catch (error) {
        console.error("[NewAlertPage] Error fetching log entries:", error);
        if (mounted) {
          setLogEntries([]);
          setHasFetchedLogs(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (authStatus === "loading") {
      // Still loading auth state
      return;
    }

    if (authStatus === "authenticated" && session?.user) {
      // User is authenticated - only fetch once
      if (!hasFetchedLogs) {
        fetchLogEntries();
      } else {
        setIsLoading(false);
      }
    } else if (authStatus === "unauthenticated") {
      // User is not authenticated, redirect to login with callback URL
      router.push(`/login?callbackUrl=${encodeURIComponent("/alerts/new")}`);
    }

    return () => {
      mounted = false;
    };
  }, [authStatus, session?.user?.id, hasFetchedLogs, router]); // Include hasFetchedLogs to prevent refetching

  // Handle log entry selection from child component
  const handleLogEntrySelect = (logEntry: LogEntry | null) => {
    setSelectedLogEntry(logEntry);
  };

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
        onLogEntrySelect={handleLogEntrySelect}
      />
    </div>
  );
}
