import { useQuery } from "@tanstack/react-query";
import type { CoreForecastData } from "@/app/types/forecast";

export function useForecast(regionId: string, date?: Date) {
  return useQuery<CoreForecastData>({
    queryKey: ["forecast", regionId, date],
    queryFn: async () => {
      if (date) {
        // Use surf-conditions endpoint when date is provided
        const dateStr = date.toISOString().split("T")[0];
        const response = await fetch(
          `/api/surf-conditions?regionId=${regionId}&date=${dateStr}`
        );
        if (!response.ok) throw new Error("Failed to fetch forecast");
        const data = await response.json();
        return data.forecast;
      } else {
        // Use forecast endpoint when no date is provided (current forecast)
        const response = await fetch(`/api/forecast?regionId=${regionId}`);
        if (!response.ok) throw new Error("Failed to fetch forecast");
        return response.json();
      }
    },
    enabled: !!regionId,
    staleTime: 1000 * 60 * 5,
  });
}
