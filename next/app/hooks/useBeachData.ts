// hooks/useBeachData.ts
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { calculateBeachScore } from "@/app/lib/scoreUtils";
import type { Beach } from "@/app/types/beaches";

export function useBeachData(
  initialBeaches: Beach[],
  selectedRegion: string,
  isSidebarOpen: boolean
) {
  // Global wind data query
  const { data: allWindData, isLoading: isAllDataLoading } = useQuery({
    queryKey: ["surfConditions", "all"],
    queryFn: async () => {
      const response = await fetch(`/api/surf-conditions`);
      if (!response.ok) throw new Error("Failed to fetch conditions");
      return response.json();
    },
    enabled: !isSidebarOpen,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Beach scores calculation
  const beachScores = useMemo(() => {
    if (!allWindData) return {};

    const scores: Record<string, number> = {};

    initialBeaches.forEach((beach) => {
      try {
        const { score } = calculateBeachScore(beach, allWindData);
        scores[beach.id] = score;
      } catch (error) {
        console.error(`Error calculating score for ${beach.name}:`, error);
      }
    });

    return scores;
  }, [allWindData, initialBeaches]);

  // Beach counts data query
  const { data: beachCounts } = useQuery({
    queryKey: ["beachCounts", selectedRegion],
    queryFn: async () => {
      if (!selectedRegion) return {};

      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/beach-counts?region=${encodeURIComponent(selectedRegion)}&date=${today}`
      );
      const data = await response.json();

      if (data.count > 0) {
        const regionBeach = initialBeaches.find(
          (b) => b.region.name === selectedRegion
        );
        if (regionBeach) {
          return {
            [regionBeach.region.name]: data.count,
            [regionBeach.country.name]: data.count,
            [regionBeach.continent.name]: data.count,
          };
        }
      }
      return {};
    },
    enabled: !!selectedRegion,
  });

  return {
    allWindData,
    isAllDataLoading,
    beachScores,
    beachCounts,
  };
}
