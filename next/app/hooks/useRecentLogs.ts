// hooks/useRecentLogs.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useRecentLogs() {
  const { data: recentLogs } = useQuery({
    queryKey: ["recentLogs"],
    queryFn: async () => {
      const res = await fetch(`/api/raid-logs`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      return data.entries || []; // Backend returns { entries: [...], total: ... }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 0, // Don't retry on error
  });
  
  const latestLogs = useMemo(() => {
    if (!recentLogs) return [];
    return recentLogs.slice(0, 3); // Get first 3 logs
  }, [recentLogs]);
  
  return { recentLogs, latestLogs };
}