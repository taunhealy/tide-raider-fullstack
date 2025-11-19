import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  // Get the selected source from the forecast query cache
  // The forecast query key is ["forecast", regionId, normalizedDate, selectedSource]
  const normalizedDate =
    filters.forecastDate || new Date().toISOString().split("T")[0];

  // Try to find the source from the query cache
  let selectedSource: "WINDFINDER" | "WINDGURU" | "WINDY" = "WINDFINDER";
  const queryCache = queryClient.getQueryCache();
  const forecastQueries = queryCache.findAll({
    queryKey: ["forecast", filters.regionId],
  });
  if (forecastQueries.length > 0) {
    // Get the most recent forecast query and extract source from its key
    const latestQuery = forecastQueries[forecastQueries.length - 1];
    const queryKey = latestQuery.queryKey;
    if (queryKey.length >= 4 && typeof queryKey[3] === "string") {
      const source = queryKey[3] as "WINDFINDER" | "WINDGURU" | "WINDY";
      if (["WINDFINDER", "WINDGURU", "WINDY"].includes(source)) {
        selectedSource = source;
      }
    }
  }

  return useQuery<UseFilteredBeachesResponse>({
    queryKey: ["filteredBeaches", filters, selectedSource], // Include source in query key
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
        source?: "WINDFINDER" | "WINDGURU" | "WINDY";
      } = {};

      if (filters.regionId) params.regionId = filters.regionId;
      if (filters.searchQuery && filters.searchQuery.trim()) {
        params.searchQuery = filters.searchQuery.trim();
      }
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
      params.source = selectedSource; // Pass the selected source

      return await api.getFilteredBeaches(params);
    },
    initialData: initialData || undefined,
    enabled: enabled && !!filters.regionId,
    staleTime: 0, // Always refetch when query key changes (region change)
    gcTime: 1000 * 60 * 5, // Keep cache for 5 minutes but always refetch
  });
}
