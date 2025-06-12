"use client";

import { X } from "lucide-react";
import type { FilterConfig } from "@/app/types/raidlogs";
import { useActiveFilters } from "@/app/hooks/useActiveFilters";
import { useQuery } from "@tanstack/react-query";

interface ActiveFilterBadgesProps {
  filters: FilterConfig;
  onFilterChange: (filters: Partial<FilterConfig>) => void;
}

const badgeClassName =
  "inline-flex items-center bg-cyan-100 text-cyan-800 text-sm px-3 py-1 rounded-full font-primary";
const buttonClassName = "ml-2 text-cyan-600 hover:text-cyan-900";

export function ActiveFilterBadges({
  filters,
  onFilterChange,
}: ActiveFilterBadgesProps) {
  const {
    hasActiveFilters,
    removeBeachFilter,
    removeRegionFilter,
    removeCountryFilter,
    removeRatingFilter,
  } = useActiveFilters(filters, onFilterChange);

  // Fetch region counts
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
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const regionCounts = regionCountsData?.counts || {};

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 px-1">
      {filters.beaches?.map((beach) => (
        <div key={beach} className={badgeClassName}>
          <span className="mr-1">Beach:</span>
          {beach}
          <button
            onClick={() => removeBeachFilter(beach)}
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
