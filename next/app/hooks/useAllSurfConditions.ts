import { useQuery } from "@tanstack/react-query";

export function useAllSurfConditions(regionId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["surfConditions", regionId],
    queryFn: async () => {
      console.log("useAllSurfConditions called by WeatherForecastWidget:", {
        regionId,
        timestamp: new Date().toISOString(),
      });

      const response = await fetch(`/api/surf-conditions?regionId=${regionId}`);
      if (!response.ok) throw new Error("Failed to fetch conditions");

      const data = await response.json();
      console.log("Surf conditions API response:", data);

      // Extract forecast data from the first beach in the scores object
      const firstBeach = Object.values(data.scores || {})[0];

      const result = {
        ...data,
        forecastData: firstBeach?.forecastData || null,
      };
      console.log("Transformed result:", result);

      return result;
    },
    enabled: enabled && !!regionId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}
