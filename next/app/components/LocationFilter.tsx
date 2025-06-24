"use client";

import { useLocationFilter } from "@/app/hooks/useLocationFilter";
import { useRegionCounts } from "@/app/hooks/useRegionScores";
import { FilterHeader } from "@/app/components/ui/FilterHeader";
import RegionFilterButton from "@/app/components/ui/RegionFilterButton";
import type { FilterType, Region } from "@/app/types/beaches";

interface LocationFilterProps {
  filters: FilterType;
  setFilters: (filters: FilterType) => void;
  regions: Region[];
  disabled?: boolean;
}

export default function LocationFilter({
  filters,
  setFilters,
  regions,
}: LocationFilterProps) {
  const { data: regionCountsData } = useRegionCounts();
  const regionCounts = regionCountsData?.counts || {};

  console.log("regionCountsData from hook:", regionCountsData);
  console.log("Processed regionCounts:", regionCounts);
  console.log("Sample region:", regions[0]); // Log a sample region to see its structure

  const {
    searchQuery,
    setSearchQuery,
    filteredRegions,
    groupedRegions,
    updateUrlAndFilters,
  } = useLocationFilter(filters, setFilters, regions);

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilters({
      ...filters,
      location: { ...filters.location, region: "", regionId: "" },
    });
  };

  return (
    <div className="space-y-3 border border-md px-7 py-7 bg-white gap-9">
      <FilterHeader
        title="Location"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
        placeholder="Search regions or countries..."
      />

      <div className="flex flex-col gap-4">
        {groupedRegions ? (
          <GroupedRegionList
            groupedRegions={groupedRegions}
            filters={filters}
            regionCounts={regionCounts}
            onRegionSelect={updateUrlAndFilters}
          />
        ) : (
          <RegionList
            regions={filteredRegions}
            filters={filters}
            regionCounts={regionCounts}
            onRegionSelect={updateUrlAndFilters}
          />
        )}
      </div>
    </div>
  );
}

interface GroupedRegionListProps {
  groupedRegions: Record<string, Region[]>;
  filters: FilterType;
  regionCounts: Record<string, number>;
  onRegionSelect: (region: Region | null) => void;
}

function GroupedRegionList({
  groupedRegions,
  filters,
  regionCounts,
  onRegionSelect,
}: GroupedRegionListProps) {
  return Object.entries(groupedRegions).map(([countryName, countryRegions]) => (
    <div key={countryName} className="space-y-2">
      <h6 className="text-sm text-gray-600 font-primary">{countryName}</h6>
      <div className="flex flex-wrap gap-2">
        {countryRegions.map((region) => {
          console.log(`Region ${region.name} count:`, regionCounts[region.id]);
          return (
            <RegionFilterButton
              key={region.id}
              region={region.name}
              isSelected={filters.location.regionId === region.id}
              onClick={() =>
                onRegionSelect(
                  filters.location.regionId === region.id ? null : region
                )
              }
              count={regionCounts[region.id] || 0}
            />
          );
        })}
      </div>
    </div>
  ));
}

interface RegionListProps {
  regions: Region[];
  filters: FilterType;
  regionCounts: Record<string, number>;
  onRegionSelect: (region: Region | null) => void;
}

function RegionList({
  regions,
  filters,
  regionCounts,
  onRegionSelect,
}: RegionListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {regions.map((region) => {
        console.log(`Region ${region.name} count:`, regionCounts[region.id]);
        return (
          <RegionFilterButton
            key={region.id}
            region={region.name}
            isSelected={filters.location.regionId === region.id}
            onClick={() =>
              onRegionSelect(
                filters.location.regionId === region.id ? null : region
              )
            }
            count={regionCounts[region.id] || 0}
          />
        );
      })}
    </div>
  );
}
