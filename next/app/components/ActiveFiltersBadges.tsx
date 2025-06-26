"use client";

import { X } from "lucide-react";
import type { FilterConfig } from "@/app/types/raidlogs";
import { useActiveFilters } from "@/app/hooks/useActiveFilters";
import { useQuery } from "@tanstack/react-query";
import { useBeachContext } from "@/app/context/BeachContext";
import { useBeachData } from "@/app/hooks/useBeachData";

interface ActiveFilterBadgesProps {
  filters: FilterConfig;
  onFilterChange: (filters: Partial<FilterConfig>) => void;
}

// Using your existing CSS variables with hover states
const badgeClassName =
  "inline-flex items-center bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm px-3 py-1 rounded-full font-primary hover:opacity-80 transition-opacity";
const buttonClassName =
  "ml-2 text-[var(--color-text-secondary)] hover:opacity-70 transition-opacity";

export function ActiveFilterBadges({
  filters,
  onFilterChange,
}: ActiveFilterBadgesProps) {
  console.log("ActiveFilterBadges rendering");

  const {
    hasActiveFilters,
    removeBeachFilter,
    removeRegionFilter,
    removeCountryFilter,
    removeRatingFilter,
  } = useActiveFilters(filters, onFilterChange);

  const { filters: contextFilters } = useBeachContext();
  const { beaches = [] } = useBeachData();

  // Update the query to not depend on loadingStates
  const { data: regionCountsData } = useQuery({
    queryKey: ["region-counts"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/beach-ratings/region-counts?date=${today}`
      );
      if (!response.ok) throw new Error("Failed to fetch region counts");
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const regionCounts = regionCountsData?.counts || {};

  // Add more debug logs
  console.log("Region counts in badges:", {
    regionCounts,
    sampleRegion: filters.regions?.[0],
    sampleCount: filters.regions?.[0] ? regionCounts[filters.regions[0]] : null,
  });

  // Add this before the return statement
  console.log("DEBUG Region counts:", {
    regionCounts,
    filters,
    hasRegions: !!filters.regions?.length,
    firstRegion: filters.regions?.[0],
    firstRegionCount: filters.regions?.[0]
      ? regionCounts[filters.regions[0]]
      : null,
    allCounts: regionCounts,
  });

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 px-1">
      {filters.beaches?.map((beach) => (
        <div
          key={typeof beach === "string" ? beach : beach.id}
          className={badgeClassName}
        >
          <span className="mr-1">Beach:</span>
          {typeof beach === "string" ? beach : beach.name}
          <button
            onClick={() =>
              removeBeachFilter(typeof beach === "string" ? beach : beach.id)
            }
            className={buttonClassName}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {filters.regions?.map((region) => (
        <div key={region} className={badgeClassName}>
          <span className="mr-1">Region:</span>
          {region}
          {regionCounts[region] > 0 && (
            <span className="ml-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {regionCounts[region]}
            </span>
          )}
          <button
            onClick={() => removeRegionFilter(region)}
            className={buttonClassName}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {filters.countries?.map((country) => (
        <div key={country} className={badgeClassName}>
          <span className="mr-1">Country:</span>
          {country}
          <button
            onClick={() => removeCountryFilter(country)}
            className={buttonClassName}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {filters.minRating ? (
        <div className={badgeClassName}>
          <span className="mr-1">Rating:</span>
          {filters.minRating}+
          <button onClick={removeRatingFilter} className={buttonClassName}>
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
