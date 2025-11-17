import { useQuery } from "@tanstack/react-query";
import { BeachInitialData } from "../types/beaches";
import { useBeachFilters } from "./useBeachFilters";
import { CoreForecastData } from "../types/forecast";
import api from "../lib/api-client";

interface UseFilteredBeachesProps {
  initialData: BeachInitialData | null;
  enabled?: boolean;
}

// Update the response type to match BeachInitialData
interface UseFilteredBeachesResponse extends BeachInitialData {}

export function useFilteredBeaches({
  initialData,
  enabled = true,
}: UseFilteredBeachesProps) {
  const { filters } = useBeachFilters();

  return useQuery<UseFilteredBeachesResponse>({
    queryKey: ["filteredBeaches", filters], // React to filter changes
    queryFn: async () => {
      // Convert filters to api-client params
      const params: {
        regionId?: string;
        searchQuery?: string;
        optimalTide?: string;
        waveType?: string;
        crimeLevel?: string;
        bestSeasons?: string;
        difficulty?: string;
        hazards?: string;
        forecastDate?: string;
      } = {};

      if (filters.regionId) params.regionId = filters.regionId;
      if (filters.searchQuery) params.searchQuery = filters.searchQuery;
      if (filters.optimalTide) {
        params.optimalTide = Array.isArray(filters.optimalTide)
          ? filters.optimalTide.join(",")
          : filters.optimalTide;
      }
      if (filters.waveTypes) {
        params.waveType = Array.isArray(filters.waveTypes)
          ? filters.waveTypes.join(",")
          : filters.waveTypes;
      }
      if (filters.crimeLevel) {
        params.crimeLevel = Array.isArray(filters.crimeLevel)
          ? filters.crimeLevel.join(",")
          : filters.crimeLevel;
      }
      if (filters.bestSeasons) {
        params.bestSeasons = Array.isArray(filters.bestSeasons)
          ? filters.bestSeasons.join(",")
          : filters.bestSeasons;
      }
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.hazards) {
        params.hazards = Array.isArray(filters.hazards)
          ? filters.hazards.join(",")
          : filters.hazards;
      }
      if (filters.forecastDate) params.forecastDate = filters.forecastDate;

      return await api.getFilteredBeaches(params);
    },
    initialData: initialData || undefined,
    enabled: enabled && !!filters.regionId,
    staleTime: 0, // Always refetch when query key changes (region change)
    gcTime: 1000 * 60 * 5, // Keep cache for 5 minutes but always refetch
  });
}
