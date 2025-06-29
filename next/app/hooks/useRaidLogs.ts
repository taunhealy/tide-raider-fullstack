// app/hooks/useRaidLogs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FilterConfig,
  LogEntry,
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
    select: (data) => ({
      entries: data.entries.map(
        (entry: any): LogEntry => ({
          id: entry.id || "",
          date: new Date(entry.date || new Date()),
          surferName: entry.surferName || null,
          surferEmail: entry.surferEmail || null,
          beachName: entry.beachName || null,
          surferRating: entry.surferRating || 0,
          comments: entry.comments || null,
          isPrivate: entry.isPrivate || false,
          isAnonymous: entry.isAnonymous || false,
          continent: entry.continent || null,
          country: entry.country || null,
          region: entry.region?.name || null,
          waveType: entry.waveType || null,
          beachId: entry.beachId || null,
          forecastId: entry.forecastId || null,
          userId: entry.userId || null,
          hasAlert: entry.hasAlert || false,
          isMyAlert: entry.isMyAlert || false,
          alertId: entry.alertId || "",
          imageUrl: entry.imageUrl || null,
          videoUrl: entry.videoUrl || null,
          videoPlatform: entry.videoPlatform || null,
          forecast: entry.forecast
            ? {
                ...entry.forecast,
                swellHeight:
                  Number(entry.forecast.swellHeight?.toFixed(2)) || 0,
              }
            : null,
          user: entry.user
            ? {
                id: entry.user.id || "",
                nationality: entry.user.nationality || "",
                name: entry.user.name || "",
              }
            : undefined,
        })
      ),
      total: data.total,
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
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
