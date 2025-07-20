import { useQuery } from "@tanstack/react-query";
import { BeachInitialData } from "../types/beaches";
import { useBeachFilters } from "./useBeachFilters";
import { CoreForecastData } from "../types/forecast";

interface UseFilteredBeachesProps {
  initialData: BeachInitialData | null;
  enabled?: boolean;
}

interface UseFilteredBeachesResponse {
  beaches: any[];
  scores: Record<string, any>;
  forecastData: CoreForecastData | null;
}

export function useFilteredBeaches({
  initialData,
  enabled = true,
}: UseFilteredBeachesProps) {
  const { filters } = useBeachFilters();

  return useQuery<UseFilteredBeachesResponse>({
    queryKey: ["filteredBeaches", filters], // React to filter changes
    queryFn: async () => {
      // Convert filters to URLSearchParams
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            if (value.length) params.set(key, value.join(','));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/filtered-beaches?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch filtered beaches");
      return response.json();
    },
    enabled: enabled && !!filters.regionId, // Use filters.regionId instead
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}