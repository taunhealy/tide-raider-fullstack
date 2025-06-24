"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FilterType, Region } from "@/app/types/beaches";
import { HARDCODED_COUNTRIES } from "@/app/lib/location/countries/constants";

export function useLocationFilter(
  initialFilters: FilterType,
  setFilters: (filters: FilterType) => void,
  regions: Region[]
) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const filteredRegions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return regions.filter(
      (region) =>
        region.name.toLowerCase().includes(query) ||
        region.country?.name.toLowerCase().includes(query)
    );
  }, [regions, searchQuery]);

  const groupedRegions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (
      !HARDCODED_COUNTRIES.some((country) =>
        country.name.toLowerCase().includes(query)
      )
    ) {
      return null;
    }

    return filteredRegions.reduce(
      (acc, region) => {
        const countryName = region.country?.name || "Other";
        acc[countryName] = [...(acc[countryName] || []), region];
        return acc;
      },
      {} as Record<string, Region[]>
    );
  }, [filteredRegions, searchQuery]);

  const updateUrlAndFilters = (region: Region | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (region) {
      params.set("regionId", region.id);
      params.delete("region");
      params.delete("id");
    } else {
      params.delete("regionId");
      params.delete("region");
      params.delete("id");
    }

    router.push(`/raid${params.toString() ? `?${params.toString()}` : ""}`);

    setFilters({
      ...initialFilters,
      location: {
        ...initialFilters.location,
        regionId: region?.id || "",
      },
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredRegions,
    groupedRegions,
    updateUrlAndFilters,
  };
}
