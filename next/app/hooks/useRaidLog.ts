// app/hooks/useRaidLog.ts
import { useQuery } from "@tanstack/react-query";
import type { LogEntry } from "@/app/types/raidlogs";
import api from "@/app/lib/api-client";

export function useRaidLog(id: string) {
  return useQuery({
    queryKey: ["raidLog", id],
    retry: (failureCount, error: any) => {
      // Don't retry on 403, 404, or 401 errors
      const status = error?.response?.status;
      if (status === 403 || status === 404 || status === 401) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        const [logData, alertData] = await Promise.all([
          api.getRaidLogs({ id }),
          api.getAlerts({ logEntryId: id }).catch(() => []),
        ]);

        // Backend returns entry directly when fetching by ID, or in entries array
        let entry = null;

        // Check if it's a direct entry object (when fetching by ID)
        // Type assertion needed because backend can return either format
        const data = logData as any;
        if (data.id && typeof data.id === "string") {
          entry = data;
        }
        // Check if it's paginated format with entries array
        else if (
          data.entries &&
          Array.isArray(data.entries) &&
          data.entries.length > 0
        ) {
          entry = data.entries[0];
        }

        if (!entry) {
          console.error("Log entry not found. Response data:", logData);
          throw new Error("Log entry not found");
        }

        return {
          ...entry,
          existingAlert:
            Array.isArray(alertData) && alertData.length > 0
              ? alertData[0]
              : null,
        };
      } catch (error: any) {
        // Handle specific HTTP status codes and error messages
        const status = error?.response?.status;
        const errorMessage = (error?.message || "").toLowerCase();

        // Check for 403 Forbidden or "Unauthorized" messages (permission denied)
        if (
          status === 403 ||
          errorMessage.includes("unauthorized") ||
          errorMessage.includes("permission") ||
          errorMessage.includes("private entry")
        ) {
          throw new Error(
            "You don't have permission to view this private log entry"
          );
        }

        // Check for 404 Not Found
        if (
          status === 404 ||
          errorMessage.includes("not found") ||
          errorMessage.includes("does not exist")
        ) {
          throw new Error("Log entry not found");
        }

        // Check for 401 Unauthorized (authentication required)
        if (
          status === 401 ||
          errorMessage.includes("authentication required")
        ) {
          throw new Error("Please sign in to view this log entry");
        }

        // Re-throw with original message for other errors
        throw error;
      }
    },
  });
}
