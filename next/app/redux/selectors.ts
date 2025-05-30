//Redux-Specific Derived State:
// It combines multiple pieces of Redux state (allBeaches and filters)
// Creates derived state for the UI based on Redux state
// Uses Redux's createSelector for memoization
// Performance Optimization:
// Memoized with createSelector
// Only recalculates when dependencies change
// Prevents unnecessary re-renders
// UI State Calculation:
// Directly feeds into filter UI components
// Maintains filter hierarchy (continent → country → region)
// Tightly coupled with Redux filter state
// Not a General Utility:
// Specific to Redux state shape
// Not reusable outside Redux context
// Depends on Redux selectors (selectAllBeaches, selectFilters)

import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./store";
import {
  calculateRegionCounts,
  calculateAllBeachScores,
  calculateBeachScore,
  isBeachSuitable,
} from "@/app/lib/surfUtils";
import { CoreForecastData } from "../types/forecast";
import { filterBeaches } from "@/app/lib/filterUtils";

// Add "export" to make these base selectors available
export const selectAllBeaches = (state: RootState) => state.beaches.allBeaches;
export const selectFilters = (state: RootState) => state.filters;
export const selectBeachScoresState = (state: RootState) =>
  state.beaches.beachScores;
export const selectSelectedRegion = (state: RootState) =>
  state.filters.selectedRegion;

// Memoized filter selectors
export const selectBeachAttributes = createSelector(
  [selectAllBeaches],
  (allBeaches) => {
    // Return empty arrays if allBeaches is null/undefined
    if (!allBeaches || !allBeaches.length) {
      return {
        uniqueRegions: [],
        uniqueContinents: [],
        uniqueCountries: [],
        waveTypes: [],
      };
    }

    const uniqueRegions = Array.from(
      new Set(allBeaches.map((beach) => beach.region || ""))
    ).filter(Boolean);

    const uniqueContinents = Array.from(
      new Set(allBeaches.map((beach) => beach.continent || ""))
    ).filter(Boolean);

    const uniqueCountries = Array.from(
      new Set(allBeaches.map((beach) => beach.country || ""))
    ).filter(Boolean);

    const waveTypes = Array.from(
      new Set(allBeaches.map((beach) => beach.waveType || ""))
    ).filter(Boolean);

    return { uniqueRegions, uniqueContinents, uniqueCountries, waveTypes };
  }
);

// Efficient filtering that doesn't recalculate scores
export const selectFilteredBeaches = createSelector(
  [selectAllBeaches, selectFilters],
  (allBeaches, filters) => filterBeaches(allBeaches, filters)
);

// SIMPLIFY this selector to just get basic data
export const selectRegionBeaches = createSelector(
  [selectFilteredBeaches, selectSelectedRegion],
  (filteredBeaches, selectedRegion) => {
    // Only filter by region - no complex transformations
    if (!filteredBeaches.length || !selectedRegion) return [];
    return filteredBeaches.filter((beach) => beach.region === selectedRegion);
  }
);

// Simplified selector that uses utility functions
export const selectSortedBeaches = createSelector(
  [selectFilteredBeaches, selectBeachScoresState, selectSelectedRegion],
  (filteredBeaches, beachScores, selectedRegion) => {
    if (!filteredBeaches.length || !selectedRegion) return [];

    // Filter by selected region first - this should be in a utility function
    const regionBeaches = filteredBeaches.filter(
      (beach) => beach.region === selectedRegion
    );

    // Use existing score data from the state
    const beachesWithScores = regionBeaches.map((beach) => {
      const scoreInfo = beachScores[beach.id] || { score: 0, suitable: false };
      return {
        ...beach,
        score: scoreInfo.score || 0,
        suitable: scoreInfo.suitable || false,
      };
    });

    // Sort by score - this should be in a utility function
    return [...beachesWithScores].sort((a, b) => b.score - a.score);
  }
);

// Selector for suitable beaches
export const selectSuitableBeaches = createSelector(
  [selectSortedBeaches],
  (sortedBeaches) => {
    return sortedBeaches.filter((beach) => beach.suitable);
  }
);

// Selector for visible beaches (paginated)
export const selectVisibleBeaches = createSelector(
  [selectSortedBeaches, (state: RootState) => state.ui.currentPage],
  (sortedBeaches, currentPage) => {
    const itemsPerPage = 20;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedBeaches.slice(startIndex, startIndex + itemsPerPage);
  }
);

// Keep selectBeachScores as a simple selector
export const selectBeachScores = createSelector(
  [
    (state: RootState) => state.beaches.allBeaches,
    (state: RootState) => state.forecast.data,
  ],
  (allBeaches, forecastData) => {
    if (!forecastData || !allBeaches) return {};

    // Extract core forecast data
    const coreConditions: CoreForecastData = {
      windSpeed: forecastData.windSpeed,
      windDirection: forecastData.windDirection,
      swellHeight: forecastData.swellHeight,
      swellDirection: forecastData.swellDirection,
      swellPeriod: forecastData.swellPeriod,
    };

    // Use surfUtils to calculate all scores
    return calculateAllBeachScores(allBeaches, coreConditions);
  }
);

// Use the memoized beach scores selector
export const selectRegionCounts = createSelector(
  [selectBeachScores],
  (beachScores) => calculateRegionCounts(beachScores)
);

// Keep this in selectors.ts since it's Redux-specific
export const selectVisibleFilterOptions = createSelector(
  [selectAllBeaches, selectFilters],
  (
    allBeaches,
    filters
  ): { visibleCountries: string[]; visibleRegions: string[] } => {
    if (!allBeaches) return { visibleCountries: [], visibleRegions: [] };

    const visibleCountries =
      filters.continent.length > 0
        ? [
            ...new Set(
              allBeaches
                .filter((beach) => filters.continent.includes(beach.continent))
                .map((beach) => beach.country)
            ),
          ]
        : [];

    const visibleRegions =
      filters.country.length > 0
        ? [
            ...new Set(
              allBeaches
                .filter((beach) => filters.country.includes(beach.country))
                .map((beach) => beach.region)
            ),
          ]
        : [];

    return { visibleCountries, visibleRegions };
  }
);
