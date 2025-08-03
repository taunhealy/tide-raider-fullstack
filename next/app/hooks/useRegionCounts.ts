"use client";

import { useQuery } from "@tanstack/react-query";
import { useBeachData } from "@/app/hooks/useBeachData";

export function useRegionCounts() {
  return useQuery({
    queryKey: ["region-counts"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/beach-ratings/region-counts?date=${today}`
      );
      if (!response.ok) throw new Error("Failed to fetch region counts");
      const json = await response.json();
      return json.counts; // <-- THIS LINE is the fix!
    },
    staleTime: 1000 * 60 * 5,
  });
}
