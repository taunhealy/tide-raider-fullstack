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
        // Return empty data structure instead of throwing to prevent loading state from persisting
        return {
          entries: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        };
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

      // Debug: Log forecast data in first entry
      if (data.entries.length > 0 && data.entries[0].forecast) {
        console.log("[useRaidLogs] First entry forecast:", {
          entryId: data.entries[0].id,
          forecast: data.entries[0].forecast,
        });
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
            forecast: entry.forecast
              ? {
                  id: entry.forecast.id,
                  date:
                    typeof entry.forecast.date === "string"
                      ? entry.forecast.date
                      : typeof entry.forecast.date === "object" &&
                          entry.forecast.date !== null &&
                          "toISOString" in entry.forecast.date
                        ? (entry.forecast.date as Date)
                            .toISOString()
                            .split("T")[0]
                        : String(entry.forecast.date),
                  windSpeed: entry.forecast.windSpeed ?? 0,
                  windDirection: entry.forecast.windDirection ?? 0,
                  swellHeight: entry.forecast.swellHeight ?? 0,
                  swellPeriod: entry.forecast.swellPeriod ?? 0,
                  swellDirection: entry.forecast.swellDirection ?? 0,
                }
              : null,
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
    staleTime: 30 * 1000, // Data is fresh for 30 seconds - reduces unnecessary refetches
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes - improves performance
    refetchOnWindowFocus: false, // Don't refetch on focus - too aggressive for logs page
    refetchOnMount: false, // Use cached data if available - faster initial load
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: 1, // Retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    throwOnError: false, // Don't throw errors, return them in error state
    networkMode: "online", // Only run query when online
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
