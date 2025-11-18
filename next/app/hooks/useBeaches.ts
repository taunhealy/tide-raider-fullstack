// app/hooks/useBeaches.ts
import { useQuery } from "@tanstack/react-query";
import type { Beach } from "@/app/types/beaches";
import api from "@/app/lib/api-client";

export function useBeaches(options?: { enabled?: boolean }) {
  return useQuery<Beach[]>({
    queryKey: ["beaches"],
    queryFn: async () => {
      const data = await api.getBeaches();
      return data.beaches;
    },
    enabled: options?.enabled !== false, // Default to true if not specified
    staleTime: 10 * 60 * 1000, // 10 minutes - beaches don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    retry: 1, // Only retry once on failure
  });
}
