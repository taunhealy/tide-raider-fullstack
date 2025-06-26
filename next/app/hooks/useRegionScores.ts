"use client";

import { useQuery } from "@tanstack/react-query";
import { useBeachData } from "@/app/hooks/useBeachData";

export function useRegionCounts() {
  const { beachScores = {} } = useBeachData();
  const hasScores = Object.keys(beachScores).length > 0;

  console.log("useRegionCounts conditions:", {
    beachScoresLength: Object.keys(beachScores).length,
    hasScores,
    queryEnabled: hasScores,
  });

  return useQuery({
    queryKey: ["region-counts"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/beach-ratings/region-counts?date=${today}`
      );
      if (!response.ok) throw new Error("Failed to fetch region counts");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
