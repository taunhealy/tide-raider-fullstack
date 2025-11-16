import { useQuery } from "@tanstack/react-query";
import type { CoreForecastData } from "@/app/types/forecast";
import api from "@/app/lib/api-client";

export function useForecast(regionId: string, date?: Date) {
  return useQuery<CoreForecastData>({
    queryKey: ["forecast", regionId, date],
    queryFn: async () => {
      if (date) {
        // Use surf-conditions endpoint when date is provided
        const dateStr = date.toISOString().split("T")[0];
        const data = await api.request<any>(
          `/api/surf-conditions?regionId=${regionId}&date=${dateStr}`
        );
        return data.forecast;
      } else {
        // Use forecast endpoint when no date is provided (current forecast)
        return await api.getForecast(regionId);
      }
    },
    enabled: !!regionId,
    staleTime: 1000 * 60 * 5,
  });
}
