"use client";

import { useRegionCounts } from "@/app/hooks/useRegionScores";
import { FilterHeader } from "./ui/FilterHeader";
import RegionFilterButton from "./ui/RegionFilterButton";
import type { Region } from "@/app/types/beaches";
import { useState, useMemo, useEffect } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useSearchParams } from "next/navigation";

interface LocationFilterProps {
  regions: Region[];
}

export default function LocationFilter({ regions }: LocationFilterProps) {
  const { data: regionCountsData } = useRegionCounts();
  const [searchQuery, setSearchQuery] = useState("");
  const { filters, selectRegion } = useBeachFilters();
  const searchParams = useSearchParams();

  // Debug logging for URL parameters
  useEffect(() => {
    console.log("URL Parameters:", Object.fromEntries(searchParams.entries()));
    console.log("Current regionId from filters:", filters.regionId);
  }, [searchParams, filters.regionId]);

  // Debug logging
  useEffect(() => {
    console.log("Regions data:", regions);
    console.log("Current region ID:", filters.regionId);
  }, [regions, filters.regionId]);

  const filteredRegions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return regions.filter(
      (region) =>
        region.name.toLowerCase().includes(query) ||
        region.country?.name.toLowerCase().includes(query)
    );
  }, [regions, searchQuery]);

  // More debug logging
  useEffect(() => {
    console.log("Filtered regions:", filteredRegions);
  }, [filteredRegions]);

  // Add a fallback if no regions are available
  if (!regions || regions.length === 0) {
    return (
      <div className="space-y-4">
        <FilterHeader
          title="Locations"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={() => {
            setSearchQuery("");
            selectRegion(null);
          }}
        />
        <div className="text-sm text-gray-500">No regions available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterHeader
        title="Locations"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={() => {
          setSearchQuery("");
          selectRegion(null);
        }}
      />
      <div className="space-y-2">
        {filteredRegions.length > 0 ? (
          filteredRegions.map((region) => {
            const isSelected = region.id.toLowerCase() === filters.regionId;
            console.log(
              `Region ${region.name} isSelected:`,
              isSelected,
              `(${region.id.toLowerCase()} === ${filters.regionId})`
            );

            return (
              <RegionFilterButton
                key={region.id}
                region={region}
                isSelected={isSelected}
                onClick={(region) => {
                  console.log(
                    "LocationFilter received click for region:",
                    region
                  );
                  selectRegion(region);
                }}
                count={regionCountsData?.[region.id] || 0}
              />
            );
          })
        ) : (
          <div className="text-sm text-gray-500">
            {searchQuery ? "No matching regions" : "No regions available"}
          </div>
        )}
      </div>
    </div>
  );
}
