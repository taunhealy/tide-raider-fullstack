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

      return {
        ...logData,
        existingAlert:
          Array.isArray(alertData) && alertData.length > 0
            ? alertData[0]
            : null,
      };
    },
  });
}
