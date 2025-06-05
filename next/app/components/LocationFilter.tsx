"use client";

// RegionFilter not a generic/reusable component that might be used in different contexts, therefore using React Context directly in the component works well to avoid prop drilling.

import React, { useMemo } from "react";
import type { FilterType, Region } from "@/app/types/beaches";
import { Button } from "@/app/components/ui/Button";
import { useBeach } from "@/app/context/BeachContext";

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
};

export default function LocationFilter({
  filters = defaultFilters,
  setFilters,
  regions,
}: LocationFilterProps) {
  const { regionCounts } = useBeach();

  // Extract unique countries from regions
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    regions.forEach((region) => {
      if (region.country?.name) {
        countries.add(region.country.name);
      }
    });
    return Array.from(countries).sort();
  }, [regions]);

  return (
    <div className="space-y-3 border border-md px-5 py-5 bg-white">
      <h4 className="font-medium text-[16px] text-gray-700 font-primary">
        Location
      </h4>

      {/* Country buttons */}
      <div className="space-y-2">
        <h5 className="text-sm text-gray-600 font-primary">Countries</h5>
        <div className="flex flex-wrap gap-2">
          {uniqueCountries.map((country) => (
            <Button
              key={country}
              variant="regions"
              isActive={filters.location.country === country}
              onClick={() =>
                setFilters({
                  ...filters,
                  location: {
                    ...filters.location,
                    country:
                      filters.location.country === country ? "" : country,
                    // Reset region when changing country
                    region: "",
                    regionId: "",
                  },
                })
              }
            >
              {country}
            </Button>
          ))}
        </div>
      </div>

      {/* Region buttons - Only show regions for selected country */}
      <div className="space-y-2">
        <h5 className="text-sm text-gray-600 font-primary">Regions</h5>
        <div className="flex flex-wrap gap-2">
          {regions
            .filter(
              (region) =>
                !filters.location.country ||
                region.country?.name === filters.location.country
            )
            .map((region) => (
              <Button
                key={region?.id || Math.random()}
                variant="regions"
                isActive={filters.location.regionId === region?.id}
                onClick={() =>
                  region &&
                  setFilters({
                    ...filters,
                    location: {
                      ...filters.location,
                      region: region.name,
                      regionId: region.id,
                      country: region.country?.name || filters.location.country,
                    },
                  })
                }
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
