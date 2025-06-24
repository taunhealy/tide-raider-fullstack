"use client";

import { useQuery } from "@tanstack/react-query";
import { useBeach } from "@/app/context/BeachContext";

export function useRegionCounts() {
  const { loadingStates, beachScores } = useBeach();
  const hasScores = Object.keys(beachScores).length > 0;

  console.log("useRegionCounts conditions:", {
    loadingStates,
    beachScoresLength: Object.keys(beachScores).length,
    hasScores,
    queryEnabled: !loadingStates.scores && hasScores,
  });

  return useQuery({
    queryKey: ["region-counts"],
    queryFn: async () => {
      const today = new Date();
      const response = await fetch(
        `/api/beach-ratings/region-counts?date=${today.toISOString().split("T")[0]}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch region counts");
      }
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
