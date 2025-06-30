// app/hooks/useRaidLog.ts
import { useQuery } from "@tanstack/react-query";
import type { LogEntry } from "@/app/types/raidlogs";

export function useRaidLog(id: string) {
  return useQuery({
    queryKey: ["raidLog", id],
    queryFn: async () => {
      const [logRes, alertRes] = await Promise.all([
        fetch(`/api/raid-logs?id=${id}`, {
          credentials: "include",
        }),
        fetch(`/api/alerts?logEntryId=${id}`, {
          credentials: "include",
        }),
      ]);

      if (!logRes.ok) throw new Error("Failed to fetch log entry");
      const logData = await logRes.json();
      const alertData = alertRes.ok ? await alertRes.json() : [];

      return {
        ...logData,
        existingAlert: alertData.length > 0 ? alertData[0] : null,
      };
    },
  });
}
