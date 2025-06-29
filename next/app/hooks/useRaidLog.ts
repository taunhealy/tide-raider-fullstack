// app/hooks/useRaidLog.ts
import { useQuery } from "@tanstack/react-query";
import type { LogEntry } from "@/app/types/raidlogs";

export function useRaidLog(id: string) {
  return useQuery<LogEntry>({
    queryKey: ["raidLog", id],
    queryFn: async () => {
      const response = await fetch(`/api/raid-logs/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch raid log");
      }
      return response.json();
    },
    enabled: !!id, // Only run query if we have an ID
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
