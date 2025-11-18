// app/hooks/useRaidLogs.ts
import { useMemo } from "react";
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

// Helper to create a stable query key from filters
function createStableQueryKey(
  filters: Partial<FilterConfig>,
  isPrivate: boolean,
  userId?: string
) {
  return [
    "raidLogs",
    {
      beaches: Array.isArray(filters.beaches)
        ? filters.beaches
            .map((b) => (typeof b === "string" ? b : b.id))
            .sort()
            .join(",")
        : "",
      regions: Array.isArray(filters.regions)
        ? filters.regions.sort().join(",")
        : "",
      countries: Array.isArray(filters.countries)
        ? filters.countries.sort().join(",")
        : "",
      minRating: filters.minRating ?? null,
      page: filters.page ?? 1,
      limit: filters.limit ?? 50,
      isPrivate,
      userId: userId ?? null,
    },
  ];
}

export function useRaidLogs(
  filters: Partial<FilterConfig>,
  isPrivate: boolean,
  userId?: string
) {
  const queryClient = useQueryClient();

  // Create a stable query key that won't change on every render
  // Serialize arrays to strings for stable comparison
  const queryKey = useMemo(() => {
    const beachesStr = Array.isArray(filters.beaches)
      ? filters.beaches
          .map((b) => (typeof b === "string" ? b : b.id))
          .sort()
          .join(",")
      : "";
    const regionsStr = Array.isArray(filters.regions)
      ? filters.regions.sort().join(",")
      : "";
    const countriesStr = Array.isArray(filters.countries)
      ? filters.countries.sort().join(",")
      : "";

    return [
      "raidLogs",
      {
        beaches: beachesStr,
        regions: regionsStr,
        countries: countriesStr,
        minRating: filters.minRating ?? null,
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
        isPrivate,
        userId: userId ?? null,
      },
    ];
  }, [
    // Use JSON.stringify for arrays to ensure stable comparison
    JSON.stringify(
      Array.isArray(filters.beaches)
        ? filters.beaches.map((b) => (typeof b === "string" ? b : b.id)).sort()
        : []
    ),
    JSON.stringify(
      Array.isArray(filters.regions) ? filters.regions.sort() : []
    ),
    JSON.stringify(
      Array.isArray(filters.countries) ? filters.countries.sort() : []
    ),
    filters.minRating,
    filters.page,
    filters.limit,
    isPrivate,
    userId,
  ]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const data = await fetchRaidLogs(filters, isPrivate, userId);
        return data;
      } catch (error) {
        console.error("[useRaidLogs] Error fetching logs:", error);
        throw error;
      }
    },
    select: (data: RaidLogResponse) => {
      if (!data || !data.entries) {
        console.warn("[useRaidLogs] Invalid data structure:", data);
        return {
          entries: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        };
      }
      return {
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
        total: data.total || 0,
        page: (data as any).page || 1,
        limit: (data as any).limit || 50,
        totalPages:
          (data as any).totalPages ||
          Math.ceil((data.total || 0) / ((data as any).limit || 50)),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - cache for longer to reduce server load
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent hanging
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    throwOnError: false, // Don't throw errors, return them in error state
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
