import { useQuery } from "@tanstack/react-query";

export function useForecast(regionId: string, date: Date) {
  return useQuery({
    queryKey: ["forecast", regionId, date],
    queryFn: async () => {
      const response = await fetch(
        `/api/surf-conditions?` +
          new URLSearchParams({
            date: date.toISOString().split("T")[0],
            regionId: regionId,
          })
      );

      if (!response.ok) {
        throw new Error("Failed to fetch forecast");
      }

      return response.json();
    },
    enabled: !!regionId && !!date,
  });
}
