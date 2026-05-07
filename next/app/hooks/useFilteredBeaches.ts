import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useEffect, useState } from "react";
import { BeachInitialData } from "../types/beaches";
import { useBeachFilters } from "./useBeachFilters";
import { CoreForecastData } from "../types/forecast";
import api from "../lib/api-client";
import { usePathname } from "next/navigation";

interface UseFilteredBeachesProps {
  initialData?: BeachInitialData | null;
  enabled?: boolean;
  ignoreRegion?: boolean;
}

// Update the response type to match BeachInitialData
interface UseFilteredBeachesResponse extends BeachInitialData {}

export function useFilteredBeaches({
  initialData,
  enabled = true,
  ignoreRegion = false,
}: UseFilteredBeachesProps) {
  const { filters } = useBeachFilters();
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // Get the selected source from the forecast query cache
  // The forecast query key is ["forecast", regionId, normalizedDate, selectedSource]
  const normalizedDate =
    filters.forecastDate || new Date().toISOString().split("T")[0];

  // Get selected source from localStorage (shared with WeatherForecastWidget)
  const [selectedSource, setSelectedSource] = useState<
    "WINDFINDER" | "WINDGURU" | "WINDY" | "TIDE_RAIDER"
  >(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("forecastSource");
      if (stored && ["WINDFINDER", "WINDGURU", "WINDY", "TIDE_RAIDER"].includes(stored)) {
        return stored as "WINDFINDER" | "WINDGURU" | "WINDY" | "TIDE_RAIDER";
      }
    }
    return "WINDFINDER";
  });

  // Listen for source changes from WeatherForecastWidget
  useEffect(() => {
    const handleSourceChange = (event: CustomEvent) => {
      const newSource = event.detail as "WINDFINDER" | "WINDGURU" | "WINDY" | "TIDE_RAIDER";
      if (["WINDFINDER", "WINDGURU", "WINDY", "TIDE_RAIDER"].includes(newSource)) {
        setSelectedSource(newSource);
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[useFilteredBeaches] Source changed via event:",
            newSource
          );
        }
      }
    };

    window.addEventListener(
      "forecastSourceChanged",
      handleSourceChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "forecastSourceChanged",
        handleSourceChange as EventListener
      );
    };
  }, []);

  // Source is now managed via localStorage and events from WeatherForecastWidget
  // No need for complex query cache detection

  // Track the initial source to know if it has changed
  // When source changes, the query key changes, creating a new query
  // For the new query, we shouldn't use initialData (it's for a different source)
  const [initialSource] = useState(selectedSource);
  const sourceHasChanged = selectedSource !== initialSource;

  // Only use initialData on the very first load with the initial source
  // Once source changes, the query key changes and we get a fresh query (no initialData)
  const shouldUseInitialData = !sourceHasChanged
    ? initialData || undefined
    : undefined;

  // Create a stable query key from filter values (not the object reference)
  // This ensures React Query can properly match cached queries
  const queryKey = useMemo(() => {
    // Serialize filters to create a stable key that only changes when values change
    const filterKey = {
      regionId: filters.regionId,
      searchQuery: filters.searchQuery,
      optimalTide: filters.optimalTide,
      waveTypes: filters.waveTypes,
      crimeLevel: filters.crimeLevel,
      bestSeasons: filters.bestSeasons,
      difficulty: filters.difficulty,
      hazards: filters.hazards,
      forecastDate: filters.forecastDate,
      isHiddenGem: filters.isHiddenGem,
      isRegular: filters.isRegular,
      isLongboarding: filters.isLongboarding,
      isFoiling: filters.isFoiling,
      timeSlot: filters.timeSlot,
    };

    return ["filteredBeaches", filterKey, selectedSource, ignoreRegion];
  }, [
    filters.regionId,
    ignoreRegion,
    filters.searchQuery,
    filters.optimalTide,
    filters.waveTypes,
    filters.crimeLevel,
    filters.bestSeasons,
    filters.difficulty,
    filters.hazards,
    filters.forecastDate,
    filters.isHiddenGem,
    filters.isRegular,
    filters.isLongboarding,
    filters.isFoiling,
    filters.timeSlot,
    selectedSource,
  ]);

  // 1. FAST QUERY: Markers only (no scores)
  const markersQuery = useQuery({
    queryKey: ["beachMarkers", filters.regionId, filters.searchQuery, filters.isHiddenGem, filters.isRegular],
    queryFn: async () => {
      return await api.getFilteredBeaches({
        regionId: filters.regionId || "western-cape",
        searchQuery: filters.searchQuery || undefined,
        isHiddenGem: filters.isHiddenGem,
        isRegular: filters.isRegular,
        mode: "markers" as any
      });
    },
    enabled: enabled && !!(filters.regionId || filters.searchQuery),
    staleTime: 1000 * 60 * 60, // 1 hour for markers
  });

  // 2. FULL QUERY: Including scores and forecast
  const fullQuery = useQuery<UseFilteredBeachesResponse>({
    queryKey, // Use the memoized stable key
    queryFn: async () => {
      // ... same as before
      const params: any = {
        regionId: filters.regionId || "western-cape",
        searchQuery: filters.searchQuery?.trim() || undefined,
        forecastDate: filters.forecastDate,
        isHiddenGem: filters.isHiddenGem,
        isRegular: filters.isRegular,
        isLongboarding: filters.isLongboarding ? "true" : undefined,
        isFoiling: filters.isFoiling ? "true" : undefined,
        timeSlot: filters.timeSlot,
        source: selectedSource,
        ignoreRegion: ignoreRegion
      };

      return await api.getFilteredBeaches(params);
    },
    placeholderData: markersQuery.data as any, // Use markers as placeholder
    enabled: enabled && (
      !!filters.regionId || 
      (typeof window !== "undefined" && (
        pathname === "/raid" || 
        new URLSearchParams(window.location.search).has("beachId")
      ))
    ),
    staleTime: 1000 * 60 * 5,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Combine data: markers first, then full
  const combinedData = useMemo(() => {
    if (fullQuery.data) return fullQuery.data;
    return markersQuery.data || shouldUseInitialData || null;
  }, [fullQuery.data, markersQuery.data, shouldUseInitialData]);

  return {
    ...fullQuery,
    data: combinedData,
    isLoadingMarkers: markersQuery.isLoading,
    isFullLoading: fullQuery.isLoading && !markersQuery.data
  };
}
