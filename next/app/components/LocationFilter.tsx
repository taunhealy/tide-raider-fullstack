"use client";

// RegionFilter not a generic/reusable component that might be used in different contexts, therefore using React Context directly in the component works well to avoid prop drilling.

import React, { useMemo } from "react";
import type { FilterType, Region } from "@/app/types/beaches";
import { Button } from "@/app/components/ui/Button";
import { useBeach } from "@/app/context/BeachContext";
import { HARDCODED_COUNTRIES } from "@/app/lib/location/countries/constants";

interface LocationFilterProps {
  filters: FilterType;
  setFilters: (filters: FilterType) => void;
  regions: Region[];
}

const defaultFilters: FilterType = {
  location: {
    region: "",
    regionId: "",
    country: "",
    continent: "",
  },
  waveType: [],
  difficulty: [],
  crimeLevel: [],
  minPoints: 0,
  sharkAttack: [],
  searchQuery: "",
  hasAttack: false,
};

export default function LocationFilter({
  filters = defaultFilters,
  setFilters,
  regions,
}: LocationFilterProps) {
  const { beaches, beachScores } = useBeach();

  // Calculate region counts from the beach scores
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(beachScores).forEach((score) => {
      if (score.region) {
        counts[score.region] = (counts[score.region] || 0) + 1;
      }
    });
    return counts;
  }, [beachScores]);

  // Extract unique countries from regions
  const uniqueCountries = useMemo(() => {
    return HARDCODED_COUNTRIES;
  }, []);

  // Show all regions, but highlight the ones that match the country filter
  const visibleRegions = useMemo(() => {
    return regions.map((region) => ({
      ...region,
      isDisabled:
        filters.location.country &&
        region.country?.id !== filters.location.country,
    }));
  }, [regions, filters.location.country]);

  return (
    <div className="space-y-3 border border-md px-7 py-7 bg-white gap-9">
      <h4 className="font-medium text-[16px] text-gray-700 font-primary mb-7">
        Location
      </h4>

      {/* Country buttons */}
      <div className="space-y-2 ">
        <h5 className="text-sm text-gray-600 font-primary mb-5">Countries</h5>
        <div className="flex flex-wrap gap-2">
          {uniqueCountries.map((country) => (
            <Button
              key={country.id}
              variant="regions"
              isActive={filters.location.country === country.id}
              onClick={() =>
                setFilters({
                  ...filters,
                  location: {
                    ...filters.location,
                    country:
                      filters.location.country === country.id ? "" : country.id,
                    // Reset region when changing country
                    region: "",
                    regionId: "",
                  },
                })
              }
            >
              {country.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Region buttons */}
      <div className="space-y-2 py-5">
        <h5 className="text-sm mb-5 text-gray-600 font-primary">Regions</h5>
        <div className="flex flex-wrap gap-2">
          {visibleRegions.map((region) => (
            <Button
              key={region?.id || Math.random()}
              variant="regions"
              isActive={filters.location.region === region?.name}
              disabled={region.isDisabled}
              onClick={() => {
                if (!region || region.isDisabled) return;
                setFilters({
                  ...filters,
                  location: {
                    ...filters.location,
                    region:
                      filters.location.region === region.name
                        ? ""
                        : region.name,
                    regionId:
                      filters.location.region === region.name ? "" : region.id,
                    country: filters.location.country,
                  },
                });
              }}
            >
              <span>{region?.name || "Unknown"}</span>
              {regionCounts[region?.name] > 0 && (
                <span className="ml-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {regionCounts[region?.name]}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
