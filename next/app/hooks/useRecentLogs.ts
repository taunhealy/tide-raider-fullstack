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
      return Array.isArray(data) ? data : []; // Ensure we always return an array
    },
  });
  
  const latestLogs = useMemo(() => {
    if (!recentLogs) return [];
    return recentLogs.slice(0, 3); // Get first 3 logs
  }, [recentLogs]);
  
  return { recentLogs, latestLogs };
}