// app/hooks/useRaidLogs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FilterConfig,
  LogEntry,
  RaidLogResponse,
  RaidLogResponse as RaidLogsResponse,
} from "@/app/types/raidlogs";

import api from "@/app/lib/api-client";

async function fetchRaidLogs(
  filters: Partial<FilterConfig>,
  isPrivate?: boolean,
  userId?: string
): Promise<RaidLogsResponse> {
  return api.getRaidLogs({
    beaches: filters.beaches as string[],
    regions: filters.regions as string[],
    countries: filters.countries as string[],
    minRating: filters.minRating ?? undefined,
    isPrivate: isPrivate,
    userId: userId,
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
  });
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
      return api.createRaidLog(data);
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
