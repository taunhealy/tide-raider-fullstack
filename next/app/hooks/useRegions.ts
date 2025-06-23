// app/hooks/useRegions.ts
import { useQuery } from "@tanstack/react-query";
import type { Region } from "../types/regions";

export function useRegions() {
  return useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await fetch("/api/regions");
      if (!response.ok) {
        throw new Error("Failed to fetch regions");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
