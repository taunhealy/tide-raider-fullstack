"use client ";

import { Inter } from "next/font/google";
import { FilterButton } from "./ui/filterbuttons";
import { LogEntry } from "../types/questlogs";

const inter = Inter({ subsets: ["latin"] });

interface LogbookRegionFilterProps {
  entries: LogEntry[];
  onFilterChange: (filters: RegionFilters) => void;
  selectedFilters: RegionFilters;
}

interface RegionFilters {
  regions: string[];
}

export function LogbookRegionFilter({
  entries,
  onFilterChange,
  selectedFilters,
}: LogbookRegionFilterProps) {
  // Extract unique values from entries
  const uniqueRegions = [
    ...new Set(
      entries
        .map((entry) => entry.beachId)
        .filter((beachId): beachId is string => beachId !== undefined)
    ),
  ].sort();

  // Update filters and apply filtering
  const handleRegionChange = (region: string) => {
    const newRegions = selectedFilters.regions.includes(region) ? [] : [region];
    onFilterChange({
      ...selectedFilters,
      regions: newRegions,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {uniqueRegions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Region</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueRegions.map((region) => (
              <FilterButton
                key={region}
                label={region}
                variant="region"
                isSelected={selectedFilters.regions.includes(region)}
                onClick={() => handleRegionChange(region)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
