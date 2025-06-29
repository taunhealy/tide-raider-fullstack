import { useQuery } from "@tanstack/react-query";
import type { CoreForecastData } from "@/app/types/forecast";

export function useForecast(regionId: string, date: Date) {
  return useQuery<CoreForecastData>({
    queryKey: ["forecast", regionId, date],
    queryFn: async () => {
      const response = await fetch(
        `/api/surf-conditions?` +
          new URLSearchParams({
            regionId: regionId,
            date: date.toISOString().split("T")[0],
          })
      );

      if (!response.ok) {
        throw new Error("Failed to fetch forecast");
      }

      const data = await response.json();
      return data.forecast; // surf-conditions returns { forecast, scores, beaches }
    },
    enabled: !!regionId && !!date,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
