import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Beach, BeachInitialData } from "../types/beaches";

import { useBeachFilters } from "./useBeachFilters";
import { CoreForecastData } from "../types/forecast";

interface UseFilteredBeachesProps {
  initialData: BeachInitialData | null;
  enabled?: boolean;
}

interface UseFilteredBeachesResponse {
  beaches: any[];
  scores: Record<string, any>;
  forecastData: CoreForecastData;
  isLoading: boolean;
}

export function useFilteredBeaches({
  initialData,
  enabled = true,
}: UseFilteredBeachesProps) {
  const searchParams = useSearchParams();
  const regionId = searchParams.get("regionId");
  const { filters } = useBeachFilters();

  return useQuery<UseFilteredBeachesResponse>({
    queryKey: ["surfConditions", regionId],
    queryFn: async () => {
      const response = await fetch(`/api/surf-conditions?regionId=${regionId}`);
      if (!response.ok) throw new Error("Failed to fetch conditions");
      const data = await response.json();

      return {
        beaches: data.beaches || [],
        scores: data.scores || {},
        forecastData: data.forecastData || null,
        isLoading: false,
      };
    },
    enabled: enabled && !!regionId,
    staleTime: 1000 * 60 * 5,
    initialData: initialData
      ? {
          beaches: initialData.beaches,
          scores: initialData.scores,
          forecastData: initialData.forecast || null,
          isLoading: false,
        }
      : undefined,
  });
}
