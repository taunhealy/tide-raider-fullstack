// hooks/useBeachData.ts
import { useQuery } from "@tanstack/react-query";
import { useBeachContext } from "@/app/context/BeachContext";
import type { BeachScoreMap } from "@/app/types/scores";
import type { CoreForecastData } from "@/app/types/forecast";
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
  forecast: CoreForecastData;
}

export function useBeachData() {
  const {
    filters,
    setForecastData,
    setBeachScores,
    setBeaches,
    setLoadingState,
  } = useBeachContext();

  const { data, isLoading, isFetching } = useQuery<SurfConditionsResponse>({
    queryKey: ["surf-conditions", filters.regionId],
    queryFn: async () => {
      console.log("Fetching surf conditions for region:", filters.regionId);
      setLoadingState("forecast", true);
      try {
        const response = await fetch(
          `/api/surf-conditions?regionId=${filters.regionId}`
        );
        if (!response.ok) {
          console.error("API error:", response.status, response.statusText);
          throw new Error("Failed to fetch surf conditions");
        }
        const result = await response.json();
        console.log("API response:", result);

        // Handle flat structure from API
        if (result) {
          const forecastData = {
            windSpeed: result.windSpeed,
            windDirection: result.windDirection,
            swellHeight: result.swellHeight,
            swellPeriod: result.swellPeriod,
            swellDirection: result.swellDirection,
            date: result.date || new Date(),
            regionId: filters.regionId,
          };
          console.log("Setting forecast data:", forecastData);
          setForecastData(forecastData);
        }

        if (result.scores) {
          console.log(
            "Setting beach scores:",
            Object.keys(result.scores).length
          );
          setBeachScores(result.scores);
        }
        if (result.beaches) {
          console.log("Setting beaches:", result.beaches.length);
          setBeaches(result.beaches);
        }

        return result;
      } catch (error) {
        console.error("Error in useBeachData:", error);
        throw error;
      } finally {
        setLoadingState("forecast", false);
      }
    },
    enabled: !!filters.regionId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Return the forecast data directly from the response if it's flat
  return {
    beaches: data?.beaches || [],
    beachScores: data?.scores || {},
    forecastData: data
      ? {
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          swellHeight: data.swellHeight,
          swellPeriod: data.swellPeriod,
          swellDirection: data.swellDirection,
          date: data.date || new Date(),
          regionId: filters.regionId,
        }
      : null,
    isLoading: isLoading || isFetching,
  };
}
