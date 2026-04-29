"use client";

import { useRegionCounts } from "@/app/hooks/useRegionCounts";
import { FilterHeader } from "./ui/FilterHeader";
import RegionFilterButton from "./ui/RegionFilterButton";
import type { Region } from "@/app/types/beaches";
import { useState, useMemo, useEffect } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useSearchParams } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";

interface LocationFilterProps {
  regions: Region[];
}

export default function LocationFilter({ regions }: LocationFilterProps) {
  const { data: regionCountsData } = useRegionCounts();
  const [searchQuery, setSearchQuery] = useState("");
  const { filters, selectRegion } = useBeachFilters();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Add tracking mutation
  const { mutate: trackSearch } = useMutation({
    mutationFn: async (regionId: string) => {
      const res = await fetch("/api/user-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId }),
      });
      if (!res.ok) throw new Error("Failed to track search");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentSearches"] });
    },
  });

  const groupedRegions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = regions.filter(
      (region) =>
        region && (region.name.toLowerCase().includes(query) ||
        (region.country?.name || "").toLowerCase().includes(query))
    );

    // Group by country
    const groups: Record<string, { name: string; id: string; continent: string; regions: Region[] }> = {};
    
    filtered.forEach(region => {
      const countryId = region.countryId || "unknown";
      const countryName = region.country?.name || countryId.toUpperCase();
      const continent = region.continent || "";
      
      if (!groups[countryId]) {
        groups[countryId] = { name: countryName, id: countryId, continent, regions: [] };
      }
      groups[countryId].regions.push(region);
    });

    // Sort countries alphabetically
    const sortedCountryIds = Object.keys(groups).sort((a, b) => 
      groups[a].name.localeCompare(groups[b].name)
    );

    return sortedCountryIds.map(id => ({
      ...groups[id],
      // Sort regions within country alphabetically
      regions: groups[id].regions.sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [regions, searchQuery]);

  // Add a fallback if no regions are available
  if (!regions || regions.length === 0) {
    return (
      <div className="space-y-4">
        <FilterHeader
          title="Regions"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={() => {
            setSearchQuery("");
            selectRegion(null);
          }}
        />
        <div className="text-sm text-gray-500 font-primary">No regions available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterHeader
        title="Regions"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={() => {
          setSearchQuery("");
          selectRegion(null);
        }}
      />
      <div className="space-y-6 overflow-x-hidden">
        {groupedRegions.length > 0 ? (
          groupedRegions.map((group) => (
            <div key={group.id} className="space-y-2">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 flex flex-wrap items-center gap-1">
                <span className="text-[var(--color-primary)] opacity-80">{group.name}</span>
                <span className="opacity-40">,</span>
                <span className="opacity-50">{group.continent}</span>
              </h3>
              <div className="flex flex-col gap-1 ml-1 border-l border-gray-100 pl-3">
                {group.regions.map((region) => {
                  const isSelected = region.id.toLowerCase() === filters.regionId;

                  return (
                    <RegionFilterButton
                      key={region.id}
                      region={region}
                      isSelected={isSelected}
                      onClick={(region) => {
                        selectRegion(region);
                        trackSearch(region.id.toLowerCase());
                      }}
                      count={regionCountsData?.[region.id] || 0}
                    />
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500 font-primary px-1">
            {searchQuery ? "No matching regions" : "No regions available"}
          </div>
        )}
      </div>
    </div>
  );
}
