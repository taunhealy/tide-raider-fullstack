"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useBackendAuth();

  // Debug logging for localhost
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    ) {
      console.log("[NewAlertPage] Auth state:", {
        authStatus,
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        isLoading,
        hasFetchedLogs,
      });
    }
  }, [authStatus, session, isLoading, hasFetchedLogs]);

  // Fetch log entry by ID from URL query parameter
  useEffect(() => {
    const logId = searchParams.get("logId");
    if (logId && session?.user) {
      console.log("[NewAlertPage] Fetching log entry by ID:", logId);

      // Don't set isLoading - let the page render immediately
      // The log entry will populate when fetch completes

      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn("[NewAlertPage] Log entry fetch timeout after 10 seconds");
        toast.error(
          "Log entry fetch timed out. You can still create an alert manually."
        );
      }, 10000); // 10 second timeout

      api
        .getLog(logId)
        .then((logEntry) => {
          clearTimeout(timeoutId);
          console.log("[NewAlertPage] Log entry fetched:", logEntry);
          setSelectedLogEntry(logEntry);
          // Don't set isLoading here - page should already be rendered
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error("[NewAlertPage] Error fetching log entry:", error);
          console.error("[NewAlertPage] Error details:", {
            message: error.message,
            response: (error as any).response,
          });
          toast.error(
            "Failed to load log entry. You can still create an alert manually."
          );
          // Don't block page loading if log fetch fails
        });

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [searchParams, session?.user]);

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
            try {
              const data = await api.getLogs();
              console.log(
                "[NewAlertPage] Log entries fetched:",
                data?.length || 0,
                "entries"
              );
              console.log("[NewAlertPage] First log entry sample:", data?.[0]);
              setLogEntries(Array.isArray(data) ? data : []);
            } catch (error) {
              console.error("[NewAlertPage] Error fetching logs:", error);
              setLogEntries([]);
            }
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
            try {
              const data = await api.getLogs();
              console.log(
                "[NewAlertPage] Log entries fetched:",
                data?.length || 0,
                "entries"
              );
              console.log("[NewAlertPage] First log entry sample:", data?.[0]);
              setLogEntries(Array.isArray(data) ? data : []);
            } catch (error) {
              console.error("[NewAlertPage] Error fetching logs:", error);
              setLogEntries([]);
            }
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
          // Ensure loading is set to false even if there were errors
          setIsLoading(false);
        }
      }
    };

    // If we have session data, proceed immediately (don't wait for status to update)
    if (session?.user) {
      // User is authenticated - check limit and fetch logs
      if (!hasFetchedLogs) {
        // Set loading to false immediately so page can render
        // checkAlertLimit will run in background
        setIsLoading(false);
        checkAlertLimit();
      } else {
        setIsLoading(false);
      }
      return () => {
        mounted = false;
      };
    }

    // If auth is still loading and we don't have session data, show loader
    if (authStatus === "loading" && !session?.user) {
      // Still loading auth state - keep showing loader
      return;
    }

    // Auth finished loading but no user - redirect to login
    if (
      authStatus === "unauthenticated" ||
      (!session?.user && authStatus !== "loading")
    ) {
      // User is not authenticated, redirect to login with callback URL
      setIsLoading(false); // Set loading to false before redirect
      router.push(`/login?callbackUrl=${encodeURIComponent("/alerts/new")}`);
      return;
    }

    // If we reach here and don't have session, set loading to false
    // This handles edge cases where auth status is undefined or in an unexpected state
    if (!session?.user && authStatus !== "loading") {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [
    authStatus,
    session?.user,
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

  // If we have session data, proceed immediately (don't wait for isLoading to be false)
  // This prevents the page from being stuck in loading state
  if (session?.user) {
    // User is authenticated - show the form even if still loading logs
    // The log entry will populate when fetch completes
  } else if (isLoading || (authStatus === "loading" && !session?.user)) {
    // Show loader while loading and we don't have session data yet
    return <RandomLoader isLoading={true} />;
  } else if (
    authStatus === "unauthenticated" ||
    (!session?.user && authStatus !== "loading")
  ) {
    // Auth finished but no user - redirect will happen in useEffect
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
