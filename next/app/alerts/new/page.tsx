"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ForecastAlertModal from "@/app/components/alerts/ForecastAlertForm";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { LogEntry } from "@/app/types/raidlogs";
import api from "@/app/lib/api-client";
import { Button } from "@/app/components/ui/Button";
import { toast } from "sonner";
import { AlertLimitModal } from "@/app/components/alerts/AlertLimitModal";

export default function NewAlertPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [selectedLogEntry, setSelectedLogEntry] = useState<LogEntry | null>(
    null
  );
  const [hasFetchedLogs, setHasFetchedLogs] = useState(false);
  const [alertLimitReached, setAlertLimitReached] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
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
    // Check alert limit and fetch log entries when component mounts
    let mounted = true;

    const checkAlertLimit = async () => {
      try {
        // Check if user is premium - refresh auth state first if needed
        const isUserPremium =
          session?.user?.isSubscribed || session?.user?.hasActiveTrial;

        console.log("[NewAlertPage] Premium check:", {
          isSubscribed: session?.user?.isSubscribed,
          hasActiveTrial: session?.user?.hasActiveTrial,
          isUserPremium,
        });

        if (isUserPremium) {
          setIsPremium(true);
          setAlertLimitReached(false);
          // Premium users can create unlimited alerts, so fetch logs
          if (mounted) {
            console.log("[NewAlertPage] Fetching log entries...");
            const data = await api.getLogs();
            console.log(
              "[NewAlertPage] Log entries fetched:",
              data?.length || 0
            );
            setLogEntries(Array.isArray(data) ? data : []);
            setHasFetchedLogs(true);
          }
        } else {
          // Check alert count for free users
          const alerts = await api.getAlerts();
          const activeAlerts = Array.isArray(alerts)
            ? alerts.filter((alert: any) => alert.active !== false)
            : [];

          if (activeAlerts.length >= 1) {
            if (mounted) {
              setAlertLimitReached(true);
              setIsPremium(false);
            }
            return;
          }

          // Limit not reached, fetch log entries
          if (mounted) {
            console.log("[NewAlertPage] Fetching log entries...");
            const data = await api.getLogs();
            console.log(
              "[NewAlertPage] Log entries fetched:",
              data?.length || 0
            );
            setLogEntries(Array.isArray(data) ? data : []);
            setHasFetchedLogs(true);
          }
        }
      } catch (error) {
        console.error("[NewAlertPage] Error checking alert limit:", error);
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
      // User is authenticated - check limit and fetch logs
      if (!hasFetchedLogs) {
        checkAlertLimit();
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
  }, [
    authStatus,
    session?.user?.isSubscribed,
    session?.user?.hasActiveTrial,
    hasFetchedLogs,
    router,
  ]);

  // Listen for auth refresh events (triggered after subscription sync)
  useEffect(() => {
    const handleAuthRefresh = () => {
      console.log("[NewAlertPage] Auth refresh event received, refetching...");
      // Force re-check alert limit when auth state refreshes
      setHasFetchedLogs(false);
    };

    window.addEventListener("auth-refresh", handleAuthRefresh);
    return () => {
      window.removeEventListener("auth-refresh", handleAuthRefresh);
    };
  }, []);

  // Also refetch when session subscription status changes
  useEffect(() => {
    if (session?.user) {
      setHasFetchedLogs(false);
    }
  }, [session?.user?.isSubscribed, session?.user?.hasActiveTrial]);

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
      <AlertLimitModal
        isOpen={alertLimitReached && !isPremium}
        onClose={() => {
          setAlertLimitReached(false);
          router.push("/alerts");
        }}
      />
      <ForecastAlertModal
        isOpen={!alertLimitReached || isPremium}
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
