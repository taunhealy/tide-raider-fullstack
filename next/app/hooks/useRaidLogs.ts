// app/hooks/useRaidLogs.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { raidLogsApi } from '@/app/api/raid-logs/route';
import { FilterConfig, LogEntry } from '@/app/types/raidlogs';

export function useRaidLogs(filters: FilterConfig, isPrivate: boolean, userId?: string) {
  const queryClient = useQueryClient();

  // Query for fetching raid logs
  const query = useQuery({
    queryKey: ['raidLogs', filters, isPrivate, userId],
    queryFn: () => raidLogsApi.getRaidLogs(filters, isPrivate, userId),
    select: (data) => ({
      entries: data.entries.map((entry: any): LogEntry => ({
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
        region: entry.region || null,
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
        forecast: entry.forecast ? {
          id: entry.forecast.id || "",
          date: new Date(entry.forecast.date),
          region: entry.forecast.region || "",
          createdAt: new Date(entry.forecast.createdAt || new Date()),
          updatedAt: new Date(entry.forecast.updatedAt || new Date()),
          windSpeed: entry.forecast.windSpeed || 0,
          windDirection: entry.forecast.windDirection || 0,
          swellHeight: entry.forecast.swellHeight || 0,
          swellPeriod: entry.forecast.swellPeriod || 0,
          swellDirection: entry.forecast.swellDirection || 0,
        } : null,
        user: entry.user ? {
          id: entry.user.id || "",
          nationality: entry.user.nationality || "",
          name: entry.user.name || "",
        } : undefined
      })),
      total: data.total
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    keepPreviousData: true,
  });

  // Mutation for creating new raid logs
  const createMutation = useMutation({
    mutationFn: raidLogsApi.createRaidLog,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['raidLogs'] });
    },
  });

  return {
    ...query,
    createRaidLog: createMutation.mutate,
    isCreating: createMutation.isLoading,
    createError: createMutation.error,
  };
}