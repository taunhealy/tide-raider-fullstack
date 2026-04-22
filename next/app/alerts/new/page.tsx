"use client";

import { useState, useEffect, useRef } from "react";
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

      // Add timeout to the API call itself
      const fetchPromise = api.getLog(logId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      Promise.race([fetchPromise, timeoutPromise])
        .then((logEntry) => {
          clearTimeout(timeoutId);
          console.log("[NewAlertPage] Log entry fetched:", logEntry);
          setSelectedLogEntry(logEntry as LogEntry);
          // Don't set isLoading here - page should already be rendered
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error("[NewAlertPage] Error fetching log entry:", error);
          console.error("[NewAlertPage] Error details:", {
            message: error instanceof Error ? error.message : String(error),
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

  const isMounted = useRef(true);

  // Sync isMounted ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkAlertLimit = async () => {
    if (!session?.user) return;
    
    try {
      // Calculate alert limit based on subscription tier
      const isSubscribed = session.user.isSubscribed || session.user.subscriptionStatus === "ACTIVE";
      const hasTrial = session.user.hasActiveTrial === true;
      const alertLimit = isSubscribed ? 100 : (hasTrial ? 10 : 1);

      console.log("[NewAlertPage] Tier Limit Check:", { isSubscribed, hasTrial, alertLimit });

      // Fetch current active alerts
      try {
        const alerts = await api.getAlerts() as any[];
        const activeAlerts = Array.isArray(alerts)
          ? alerts.filter((alert: any) => alert.active !== false)
          : [];

        if (activeAlerts.length >= alertLimit) {
          if (isMounted.current) {
            setAlertLimitReached(true);
            setIsPremium(isSubscribed); 
          }
          return;
        }
      } catch (error) {
        console.error("[NewAlertPage] Error checking alerts:", error);
      }

      // Limit not reached, fetch log entries
      if (isMounted.current) {
        setIsPremium(isSubscribed || hasTrial);
        setAlertLimitReached(false);
        try {
          const data = await api.getLogs() as any[];
          if (isMounted.current) {
            setLogEntries(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error("[NewAlertPage] Error fetching logs:", error);
          if (isMounted.current) setLogEntries([]);
        }
        setHasFetchedLogs(true);
      }
    } catch (error) {
      console.error("[NewAlertPage] Error in checkAlertLimit:", error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Redirect to login if user is not authenticated and not loading
  useEffect(() => {
    if (authStatus === "unauthenticated" && !session) {
      const callbackUrl = encodeURIComponent(window.location.pathname + (window.location.search || ""));
      window.location.href = `/auth/signin?callbackUrl=${callbackUrl}`;
    }
  }, [authStatus, session]);

  // Fetch individual log if logId is present
  useEffect(() => {
    const logId = searchParams.get("logId");
    if (logId && session?.user) {
      api.getLog(logId).then(logEntry => {
        if (isMounted.current) {
          setSelectedLogEntry(logEntry as LogEntry);
        }
      }).catch(err => {
        console.error("[NewAlertPage] Error fetching log:", err);
        toast.error("Failed to load specific log entry.");
      });
    }
  }, [searchParams, session?.user]);

  // Main initialization effect
  useEffect(() => {
    if (session?.user && !hasFetchedLogs) {
      checkAlertLimit();
    } else if (authStatus !== "loading" && !session?.user) {
      setIsLoading(false);
    }
  }, [session?.user, authStatus, hasFetchedLogs]);

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

  // Show loader while loading and we don't have session data yet
  if (isLoading || (authStatus === "loading" && !session?.user)) {
    return <RandomLoader isLoading={true} />;
  }

  // Auth finished but no user - redirect will happen in useEffect
  if (
    authStatus === "unauthenticated" ||
    (!session?.user && authStatus !== "loading")
  ) {
    return <RandomLoader isLoading={true} />;
  }

  // Fallback - should not reach here, but render form anyway
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
