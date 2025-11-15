// app/hooks/useRaidLogs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FilterConfig,
  LogEntry,
  RaidLogResponse,
  RaidLogResponse as RaidLogsResponse,
} from "@/app/types/raidlogs";

async function fetchRaidLogs(
  filters: Partial<FilterConfig>,
  isPrivate?: boolean,
  userId?: string
): Promise<RaidLogsResponse> {
  const params = new URLSearchParams();

  if (filters.beaches?.length)
    params.append("beaches", filters.beaches.join(","));
  if (filters.regions?.length)
    params.append("regions", filters.regions.join(","));
  if (filters.countries?.length)
    params.append("countries", filters.countries.join(","));
  if (filters.minRating !== null)
    params.append("minRating", filters.minRating?.toString() || "");
  if (isPrivate !== undefined) params.append("isPrivate", isPrivate.toString());
  if (userId) params.append("userId", userId);

  const response = await fetch(`/api/raid-logs?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch raid logs");
  return response.json();
}

export function useRaidLogs(
  filters: Partial<FilterConfig>,
  isPrivate: boolean,
  userId?: string
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["raidLogs", filters, isPrivate, userId],
    queryFn: () => fetchRaidLogs(filters, isPrivate, userId),
    select: (data: RaidLogResponse) => ({
      entries: data.entries.map(
        (entry): LogEntry => ({
          ...entry,
          region: entry.region
            ? {
                id: entry.region.id,
                name: entry.region.name,
                continent: entry.region.continent,
                country: entry.region.country,
              }
            : null,
          beach: entry.beach
            ? {
                id: entry.beach.id,
                name: entry.beach.name,
                region: entry.beach.region
                  ? {
                      id: entry.beach.region.id,
                      name: entry.beach.region.name,
                      country: entry.beach.region.country,
                      continent: entry.beach.region.continent,
                    }
                  : null,
                waveType: entry.beach.waveType,
                difficulty: entry.beach.difficulty,
              }
            : null,
          // other fields...
        })
      ),
      total: data.total,
    }),
    staleTime: 1000 * 60, // 1 minute - shorter stale time for more fresh data
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/raid-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create raid log");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raidLogs"] });
    },
  });

  return {
    ...query,
    createRaidLog: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}
