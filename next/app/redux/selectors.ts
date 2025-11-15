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
} from "@/app/lib/scoreUtils";
import { filterBeaches } from "@/app/lib/filterUtils";
import { sortBeachesByScore } from "@/app/lib/beachSortUtils";

// Add "export" to make these base selectors available
export const selectAllBeaches = (state: RootState) => state.beaches.allBeaches;
export const selectFilters = (state: RootState) => state.filters;
export const selectBeachScoresState = (state: RootState) =>
  state.beaches.beachScores;
export const selectSelectedRegion = (state: RootState) =>
  state.filters.selectedRegion;

// Add a new selector for geographic data
export const selectGeoData = (state: RootState) => state.geo;
export const selectContinents = (state: RootState) =>
  state.geo.continents || [];
export const selectCountries = (state: RootState) => state.geo.countries || [];
export const selectRegions = (state: RootState) => state.geo.regions || [];

// Update the beach attributes selector to use geo data instead of extracting from beaches
export const selectBeachAttributes = createSelector(
  [selectContinents, selectCountries, selectRegions, selectAllBeaches],
  (continents, countries, regions, allBeaches) => {
    // Extract unique values from geo data
    const uniqueContinents = continents.map((c) => c.name);
    const uniqueCountries = countries.map((c) => c.name);
    const uniqueRegions = regions.map((r) => r.name);

    // Extract wave types from beaches
    const waveTypes = allBeaches?.length
      ? Array.from(
          new Set(allBeaches.map((beach) => beach.waveType || ""))
        ).filter(Boolean)
      : [];

    return {
      uniqueRegions,
      uniqueCountries,
      uniqueContinents,
      waveTypes,
    };
  }
);

// Update selectFilteredBeaches
export const selectFilteredBeaches = createSelector(
  [selectAllBeaches, selectFilters],
  (allBeaches, filters) => {
    console.log("🔍 selectFilteredBeaches input:", {
      allBeachesCount: allBeaches?.length || 0,
      filters,
      sampleBeach: allBeaches?.[0]
        ? {
            id: allBeaches[0].id,
            name: allBeaches[0].name,
            region: allBeaches[0].region,
          }
        : null,
    });

    const filtered = filterBeaches(allBeaches, filters);

    console.log("🔍 selectFilteredBeaches output:", {
      filteredCount: filtered.length,
      sampleFilteredBeach: filtered[0] || null,
    });

    return filtered;
  }
);

// Update region beaches selector to work with DB schema
export const selectRegionBeaches = createSelector(
  [selectFilteredBeaches, selectSelectedRegion],
  (filteredBeaches, selectedRegion) => {
    if (!filteredBeaches.length || !selectedRegion) return [];
    return filteredBeaches.filter(
      (beach) => beach.region?.name === selectedRegion
    );
  }
);

// Update selectSortedBeaches
export const selectSortedBeaches = createSelector(
  [selectFilteredBeaches, selectBeachScoresState, selectSelectedRegion],
  (filteredBeaches, beachScores, selectedRegion) => {
    console.log("🔍 selectSortedBeaches processing:", {
      filteredBeachesCount: filteredBeaches?.length || 0,
      beachScoresCount: Object.keys(beachScores || {}).length,
      selectedRegion,
      sampleBeach: filteredBeaches?.[0],
    });

    if (!filteredBeaches.length || !selectedRegion) {
      console.log("⚠️ Early return from selectSortedBeaches:", {
        noFilteredBeaches: !filteredBeaches.length,
        noSelectedRegion: !selectedRegion,
      });
      return [];
    }

    // Use filteredBeaches directly instead of regionBeaches
    const beachesWithScores = filteredBeaches.map((beach) => ({
      ...beach,
      score: beachScores[beach.id]?.score || 0,
    }));

    console.log("🔍 Beaches with scores:", {
      count: beachesWithScores.length,
      sampleBeachWithScore: beachesWithScores[0],
    });

    return beachesWithScores;
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

    // Ensure forecastData has all required CoreForecastData properties
    // If it doesn't, we can't calculate scores
    if (!forecastData.id || !forecastData.date || !forecastData.regionId) {
      console.warn("Incomplete forecast data, cannot calculate scores");
      return {};
    }

    // forecastData already contains all CoreForecastData properties
    return calculateAllBeachScores(allBeaches, forecastData);
  }
);

// Use the memoized beach scores selector
export const selectRegionCounts = createSelector(
  [selectBeachScores],
  (beachScores) => calculateRegionCounts(beachScores)
);

// Update visible filter options to work with DB schema
export const selectVisibleFilterOptions = createSelector(
  [selectCountries, selectRegions, selectFilters],
  (countries, regions, filters) => {
    // If no filters are selected, show nothing
    if (!countries.length || !regions.length) {
      return { visibleCountries: [], visibleRegions: [] };
    }

    // Filter countries by selected continents
    const visibleCountries =
      filters.continent.length > 0
        ? countries
            .filter((country) =>
              filters.continent.includes(country.continent?.name || "")
            )
            .map((country) => country.name)
        : [];

    // Filter regions by selected countries
    const visibleRegions =
      filters.country.length > 0
        ? regions
            .filter((region) =>
              filters.country.includes(region.country?.name || "")
            )
            .map((region) => region.name)
        : [];

    return { visibleCountries, visibleRegions };
  }
);
