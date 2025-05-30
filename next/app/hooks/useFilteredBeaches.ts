// hooks/useFilteredBeaches.ts
import { useMemo } from "react";
import type { Beach, Region, FilterType } from "@/app/types/beaches";
import type { ForecastData } from "@/app/types/forecast";

export function useFilteredBeaches(
  initialBeaches: Beach[],
  filters: FilterType,
  selectedRegion: string,
  searchQuery: string,
  forecastData: ForecastData | null,
  beachScores: Record<string, any>,
  minPoints: number = 0
) {
  return useMemo(() => {
    // Add null checks
    if (!initialBeaches || !filters) {
      return [];
    }

    let filtered = initialBeaches;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((beach) => {
        // Check main beach properties
        const mainPropertiesMatch =
          beach.name.toLowerCase().includes(query) ||
          beach.region.toLowerCase().includes(query) ||
          beach.description.toLowerCase().includes(query) ||
          (beach.location && beach.location.toLowerCase().includes(query));

        // Check videos if they exist
        const videoTitlesMatch =
          beach.videos?.some((video) =>
            video.title.toLowerCase().includes(query)
          ) || false;

        return mainPropertiesMatch || videoTitlesMatch;
      });
    }

    // Apply continent filter
    if (filters.continent.length > 0) {
      filtered = filtered.filter(
        (beach) => beach.continent === filters.continent[0]
      );
    }

    // Apply country filter
    if (filters.country.length > 0) {
      filtered = filtered.filter(
        (beach) => beach.country === filters.country[0]
      );
    }

    // Apply region filter
    if (filters.region.length > 0) {
      filtered = filtered.filter((beach) =>
        filters.region.includes(beach.region as Region)
      );
    } else if (selectedRegion) {
      filtered = filtered.filter((beach) => beach.region === selectedRegion);
    }

    // Apply difficulty filter
    if (filters.difficulty.length > 0) {
      filtered = filtered.filter((beach) =>
        filters.difficulty.includes(beach.difficulty)
      );
    }

    // Apply crime level filter
    if (filters.crimeLevel.length > 0) {
      filtered = filtered.filter((beach) =>
        filters.crimeLevel.includes(beach.crimeLevel)
      );
    }

    // Apply wave type filter
    if (filters.waveType.length > 0) {
      filtered = filtered.filter((beach) =>
        filters.waveType.includes(beach.waveType)
      );
    }

    // Apply shark attack filter
    if (filters.sharkAttack?.includes("true")) {
      filtered = filtered.filter((beach) => beach.sharkAttack?.hasAttack);
    }

    return filtered;
  }, [initialBeaches, filters, selectedRegion, searchQuery]);
}
