// app/hooks/useRegions.ts
import { useQuery } from "@tanstack/react-query";
import type { Region } from "../types/beaches";
import api from "../lib/api-client";

export function useRegions() {
  return useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: async () => {
      try {
        const regions = await api.getRegions();
        return Array.isArray(regions) ? regions : [];
      } catch (error) {
        console.error("[useRegions] Error fetching regions:", error);
        // Return empty array on error to prevent UI crashes
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (increased from 5)
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour (increased from 30 minutes)
    retry: 2, // Retry up to 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
