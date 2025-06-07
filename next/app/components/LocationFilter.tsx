"use client";

// RegionFilter not a generic/reusable component that might be used in different contexts, therefore using React Context directly in the component works well to avoid prop drilling.

import React, { useMemo, useState } from "react";
import type { FilterType, Region } from "@/app/types/beaches";
import { Button } from "@/app/components/ui/Button";
import { useBeach } from "@/app/context/BeachContext";
import { HARDCODED_COUNTRIES } from "@/app/lib/location/countries/constants";
import { FilterHeader } from "@/app/components/ui/FilterHeader";

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

export default function LocationFilter({
  filters = defaultFilters,
  setFilters,
  regions,
}: LocationFilterProps) {
  const { todayGoodBeaches } = useBeach();
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate region counts from today's good beaches
  const regionCounts = useMemo(() => {
    if (!todayGoodBeaches || !Array.isArray(todayGoodBeaches)) {
      return {};
    }

    return todayGoodBeaches.reduce((counts: Record<string, number>, beach) => {
      if (beach && beach.region && beach.score >= 4) {
        counts[beach.region] = (counts[beach.region] || 0) + 1;
      }
      return counts;
    }, {});
  }, [todayGoodBeaches]);

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
                    <Button
                      key={region.id}
                      variant="regions"
                      isActive={Boolean(
                        filters.location.region === region.name
                      )}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          location: {
                            ...filters.location,
                            region:
                              filters.location.region === region.name
                                ? ""
                                : region.name,
                            regionId:
                              filters.location.region === region.name
                                ? ""
                                : region.id,
                          },
                        });
                      }}
                    >
                      <span>{region.name}</span>
                      {regionCounts[region.name] > 0 && (
                        <span className="ml-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {regionCounts[region.name]}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )
          )
        ) : (
          // Show flat list when not searching by country
          <div className="flex flex-wrap gap-2">
            {filteredRegions.map((region) => (
              <Button
                key={region.id}
                variant="regions"
                isActive={Boolean(filters.location.region === region.name)}
                onClick={() => {
                  setFilters({
                    ...filters,
                    location: {
                      ...filters.location,
                      region:
                        filters.location.region === region.name
                          ? ""
                          : region.name,
                      regionId:
                        filters.location.region === region.name
                          ? ""
                          : region.id,
                    },
                  });
                }}
              >
                <span>{region.name}</span>
                {regionCounts[region.name] > 0 && (
                  <span className="ml-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {regionCounts[region.name]}
                  </span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
