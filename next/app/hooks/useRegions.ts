// app/hooks/useRegions.ts
import { useQuery } from "@tanstack/react-query";
import type { Region } from "../types/beaches";
import api from "../lib/api-client";

export function useRegions() {
  return useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: () => api.getRegions(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
