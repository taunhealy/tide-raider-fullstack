"use client";

// RegionFilter not a generic/reusable component that might be used in different contexts, therefore using React Context directly in the component works well to avoid prop drilling.

import React, { useMemo } from "react";
import { cn } from "@/app/lib/utils";
import type { FilterType, Region } from "@/app/types/beaches";

interface LocationFilterProps {
  filters: FilterType;
  setFilters: (filters: FilterType) => void;
  regions: Region[]; // Pass regions as prop instead of using context
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
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-[16px] text-gray-700 font-primary">
        Location
      </h4>
      <div className="flex flex-wrap gap-2">
        {/* Remove Global button */}

        {/* Region buttons */}
        {regions &&
          regions.map((region) => (
            <button
              key={region?.id || Math.random()}
              onClick={() =>
                region &&
                setFilters({
                  ...filters,
                  location: {
                    ...filters.location,
                    region: region.name,
                    regionId: region.id,
                  },
                })
              }
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-primary transition-colors",
                filters.location.regionId === region?.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              )}
            >
              {region?.name || "Unknown"}
            </button>
          ))}
      </div>
    </div>
  );
}
