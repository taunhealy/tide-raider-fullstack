// app/hooks/useRaidLog.ts
import { useQuery } from "@tanstack/react-query";
import type { LogEntry } from "@/app/types/raidlogs";
import api from "@/app/lib/api-client";

export function useRaidLog(id: string) {
  return useQuery({
    queryKey: ["raidLog", id],
    queryFn: async () => {
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
    },
  });
}
