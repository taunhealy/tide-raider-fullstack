"use client";

import { useBeachContext } from "@/app/context/BeachContext";
import { useRegionCounts } from "@/app/hooks/useRegionScores";
import { FilterHeader } from "@/app/components/ui/FilterHeader";
import RegionFilterButton from "@/app/components/ui/RegionFilterButton";
import type { Region } from "@/app/types/beaches";
import { useState, useMemo } from "react";

interface LocationFilterProps {
  regions: Region[];
  selectedRegion: string;
  selectedRegionId: string;
  onRegionSelect: (region: Region | null) => void;
  disabled?: boolean;
}

export default function LocationFilter({ regions }: LocationFilterProps) {
  console.log(
    "[REGION_FILTER] Rendering with regions:",
    regions.map((r) => r.id)
  );
  const { filters, updateFilters, setLoadingState } = useBeachContext();
  const { data: regionCountsData } = useRegionCounts();
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingRegionId, setLoadingRegionId] = useState<string | null>(null);

  // Filter regions based on search
  const filteredRegions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return regions.filter(
      (region) =>
        region.name.toLowerCase().includes(query) ||
        region.country?.name.toLowerCase().includes(query)
    );
  }, [regions, searchQuery]);

  const handleRegionSelect = async (region: Region | null) => {
    if (!region) return;

    setLoadingState("forecast", true);
    setLoadingRegionId(region.id);

    try {
      // Just update the filters - this will trigger the context to handle data fetching
      updateFilters({
        ...filters,
        location: {
          regionId: region.id.toLowerCase(),
          region: region.name,
          country: region.country?.name || "",
          continent: region.country?.continentId || "",
        },
      });
    } catch (error) {
      console.error("[REGION_SELECT] Error:", error);
    } finally {
      setLoadingState("forecast", false);
      setLoadingRegionId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    updateFilters({
      ...filters,
      location: {
        ...filters.location,
        regionId: "",
      },
    });
  };

  return (
    <div className="space-y-3 border border-md px-7 py-7 bg-white gap-9">
      <FilterHeader
        title="Location"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={handleClearFilters}
        placeholder="Search regions..."
      />

      <div className="flex flex-wrap gap-2">
        {filteredRegions.map((region) => {
          const isSelected = filters.location.regionId === region.id;
          const isLoading = loadingRegionId === region.id;

          return (
            <RegionFilterButton
              key={region.id}
              region={region}
              isSelected={isSelected}
              isLoading={isLoading}
              onClick={() => {
                console.log("[REGION_CLICK] Button clicked:", region.id);
                handleRegionSelect(isSelected ? null : region);
              }}
              count={regionCountsData?.counts?.[region.id] || 0}
            />
          );
        })}
      </div>
    </div>
  );
}
