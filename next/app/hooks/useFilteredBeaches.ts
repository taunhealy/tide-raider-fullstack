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

  return useQuery<UseFilteredBeachesResponse>({
    queryKey, // Use the memoized stable key
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
        isHiddenGem?: string;
        isRegular?: string;
        isLongboarding?: string;
        isFoiling?: string;
        timeSlot?: string;
        source?: "WINDFINDER" | "WINDGURU" | "WINDY" | "TIDE_RAIDER";
        ignoreRegion?: boolean;
      } = {};

      // DEFAULT REGION: Fallback to Western Cape if no region is selected
      // This prevents the "load-render-reload" flicker by providing a stable default immediately
      params.regionId = filters.regionId || "western-cape";
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
      if (filters.isHiddenGem !== undefined) params.isHiddenGem = filters.isHiddenGem;
      if (filters.isRegular !== undefined) params.isRegular = filters.isRegular;
      if (filters.isLongboarding) params.isLongboarding = "true";
      if (filters.isFoiling) params.isFoiling = "true";
      if (filters.timeSlot) params.timeSlot = filters.timeSlot;
      params.source = selectedSource; // Pass the selected source
      params.ignoreRegion = ignoreRegion; // Pass ignoreRegion flag

      if (process.env.NODE_ENV === "development") {
        console.log(
          "[useFilteredBeaches] Fetching with source:",
          selectedSource,
          params
        );
      }

      return await api.getFilteredBeaches(params);
    },
    initialData: shouldUseInitialData,
    enabled: enabled && (
      !!filters.regionId || 
      (typeof window !== "undefined" && (
        pathname === "/raid" || 
        new URLSearchParams(window.location.search).has("beachId")
      ))
    ),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes - improves performance
    refetchOnMount: false, // Use cached data if available - faster loading
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
}
