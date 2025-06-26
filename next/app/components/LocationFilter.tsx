"use client";

import { useBeachContext } from "@/app/context/BeachContext";
import { useRegionCounts } from "@/app/hooks/useRegionScores";
import { FilterHeader } from "./ui/FilterHeader";
import RegionFilterButton from "./ui/RegionFilterButton";
import type { Region } from "@/app/types/beaches";
import { useState, useMemo } from "react";

interface LocationFilterProps {
  regions: Region[];
}

export default function LocationFilter({ regions }: LocationFilterProps) {
  const { filters, updateFilters } = useBeachContext();
  const { data: regionCountsData } = useRegionCounts();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRegions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return regions.filter(
      (region) =>
        region.name.toLowerCase().includes(query) ||
        region.country?.name.toLowerCase().includes(query)
    );
  }, [regions, searchQuery]);

  const handleRegionSelect = (region: Region | null) => {
    if (!region) return;

    updateFilters({
      ...filters,
      regionId: region.id.toLowerCase(),
      region: region.name,
      country: region.country?.name || "",
      continent: region.continent || "",
    });
  };

  return (
    <div className="space-y-4">
      <FilterHeader
        title="Locations"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={() => {
          setSearchQuery("");
          handleRegionSelect(null);
        }}
      />
      <div className="space-y-2">
        {filteredRegions.map((region) => (
          <RegionFilterButton
            key={region.id}
            region={region}
            isSelected={region.id === filters.regionId}
            onClick={() => handleRegionSelect(region)}
            count={regionCountsData?.[region.id] || 0}
          />
        ))}
      </div>
    </div>
  );
}
