// app/hooks/useBeaches.ts
import { useQuery } from "@tanstack/react-query";
import type { Beach } from "@/app/types/beaches";
import api from "@/app/lib/api-client";

export function useBeaches(options?: { regionId?: string; enabled?: boolean }) {
  const regionId = options?.regionId;
  
  return useQuery<Beach[]>({
    queryKey: ["beaches", regionId || "all"],
    queryFn: async () => {
      const data = await api.getBeaches(regionId);
      return data.beaches;
    },
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 60, // 1 hour - beaches change rarely
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
