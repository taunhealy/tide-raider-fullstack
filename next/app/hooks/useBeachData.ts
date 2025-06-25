// hooks/useBeachData.ts
import { useQuery } from "@tanstack/react-query";
import { useBeachContext } from "@/app/context/BeachContext";
import type { BeachScoreMap } from "@/app/types/scores";
import type { ForecastData } from "@/app/types/forecast";
import type { Beach } from "@/app/types/beaches";

interface BeachScore {
  score: number;
  region: string;
  conditions: {
    windSpeed: number;
    windDirection: number;
    swellHeight: number;
    swellDirection: number;
    swellPeriod: number;
  };
}

interface SurfConditionsResponse {
  beaches: Beach[];
  scores: BeachScoreMap;
  forecast: ForecastData;
}

export function useBeachData() {
  const { filters } = useBeachContext();

  const { data, isLoading, isFetching } = useQuery<SurfConditionsResponse>({
    queryKey: ["surf-conditions", filters.location.regionId],
    queryFn: async () => {
      const response = await fetch(
        `/api/surf-conditions?regionId=${filters.location.regionId}`
      );
      if (!response.ok) throw new Error("Failed to fetch surf conditions");
      const result = await response.json();

      // Validate the scores structure
      console.log("API response scores:", {
        hasScores: !!result.scores,
        scoreType: typeof result.scores,
        sampleScore: result.scores && Object.entries(result.scores)[0],
      });

      return result;
    },
    enabled: !!filters.location.regionId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Ensure scores match the BeachScoreMap type
  const scores: BeachScoreMap = data?.scores || {};

  return {
    beaches: data?.beaches || [],
    beachScores: scores,
    forecastData: data?.forecast || null,
    isLoading: isLoading || isFetching, // Consider both initial load and background updates
  };
}
