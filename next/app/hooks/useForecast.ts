import { ForecastA } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

export function useForecast(region: string, date: Date) {
  return useQuery({
    queryKey: ["forecast", region, date],
    queryFn: async () => {
      const response = await fetch(
        `/api/raid-logs/forecast?region=${encodeURIComponent(region)}&date=${date.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch forecast");
      const data: ForecastA = await response.json();
      return data;
    },
    enabled: !!region && !!date,
  });
}
