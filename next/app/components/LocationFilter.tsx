"use client";

// RegionFilter not a generic/reusable component that might be used in different contexts, therefore using React Context directly in the component works well to avoid prop drilling.

import React, { useMemo, useState } from "react";
import type { FilterType, Region } from "@/app/types/beaches";
import { Button } from "@/app/components/ui/Button";
import { HARDCODED_COUNTRIES } from "@/app/lib/location/countries/constants";
import { FilterHeader } from "@/app/components/ui/FilterHeader";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useBeach } from "@/app/context/BeachContext";

interface LocationFilterProps {
  filters: FilterType;
  setFilters: (filters: FilterType) => void;
  regions: Region[];
  disabled: boolean;
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

const RegionButton = ({
  region,
  isActive,
  onClick,
  count = 0,
}: {
  region: Region;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}) => (
  <Button
    key={region.id}
    variant="regions"
    isActive={isActive}
    onClick={onClick}
    className="overflow-hidden"
  >
    <span>{region.name}</span>
    <div
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        width: count > 0 ? "20px" : "0",
        marginLeft: count > 0 ? "8px" : "0",
      }}
    >
      {count > 0 && (
        <span className="bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {count}
        </span>
      )}
    </div>
  </Button>
);

export default function LocationFilter({
  filters = defaultFilters,
  setFilters,
  regions,
}: LocationFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get loading states from context
  const { loadingStates, beachScores } = useBeach();

  // Only fetch counts when scores are ready
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
    staleTime: 1000 * 60 * 5,
    enabled: !loadingStates.scores && Object.keys(beachScores).length > 0,
  });

  const regionCounts = regionCountsData?.counts || {};

  // Enhanced search for both regions and their countries
  const filteredRegions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return regions.filter((region) => {
      // Match region name
      const regionMatch = region.name.toLowerCase().includes(query);
      // Match country name
      const countryMatch = region.country?.name.toLowerCase().includes(query);

      return regionMatch || countryMatch;
    });
  }, [regions, searchQuery]);

  // Group regions by country when searching country names
  const groupedRegions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const shouldGroupByCountry = HARDCODED_COUNTRIES.some((country) =>
      country.name.toLowerCase().includes(query)
    );

    if (shouldGroupByCountry) {
      return filteredRegions.reduce(
        (acc, region) => {
          const countryName = region.country?.name || "Other";
          if (!acc[countryName]) {
            acc[countryName] = [];
          }
          acc[countryName].push(region);
          return acc;
        },
        {} as Record<string, Region[]>
      );
    }

    return null; // Return null when not grouping
  }, [filteredRegions, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilters({
      ...filters,
      location: {
        ...filters.location,
        region: "",
        regionId: "",
      },
    });
  };

  const updateUrlAndFilters = (region: Region | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (region) {
      params.set("regionId", region.id); // Use only regionId
      params.delete("region"); // Remove redundant params
      params.delete("id");
    } else {
      params.delete("regionId");
      params.delete("region");
      params.delete("id");
    }

    // Update URL without refresh
    router.push(`/raid${params.toString() ? `?${params.toString()}` : ""}`);

    // Update filters
    setFilters({
      ...filters,
      location: {
        ...filters.location,
        region: region ? region.name : "",
        regionId: region ? region.id : "",
      },
    });
  };

  console.log("Region counts before mapping:", {
    regionCounts,
    sampleRegion: filteredRegions[0]?.name,
    sampleCount: regionCounts[filteredRegions[0]?.name],
  });

  // Move the logic outside of any handlers
  const getNewRegion = (currentRegion: Region) => {
    return filters.location.region === currentRegion.name
      ? null
      : currentRegion;
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
          // Show grouped regions when searching by country
          Object.entries(groupedRegions).map(
            ([countryName, countryRegions]) => (
              <div key={countryName} className="space-y-2">
                <h6 className="text-sm text-gray-600 font-primary">
                  {countryName}
                </h6>
                <div className="flex flex-wrap gap-2">
                  {countryRegions.map((region) => (
                    <RegionButton
                      key={region.id}
                      region={region}
                      isActive={filters.location.region === region.name}
                      onClick={() => updateUrlAndFilters(getNewRegion(region))}
                      count={regionCounts[region.name]}
                    />
                  ))}
                </div>
              </div>
            )
          )
        ) : (
          // Show flat list when not searching by country
          <div className="flex flex-wrap gap-2">
            {filteredRegions.map((region) => (
              <RegionButton
                key={region.id}
                region={region}
                isActive={filters.location.region === region.name}
                onClick={() => updateUrlAndFilters(getNewRegion(region))}
                count={regionCounts[region.name]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
