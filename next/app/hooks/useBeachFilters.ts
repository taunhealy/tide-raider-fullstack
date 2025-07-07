import { useMemo, useCallback } from "react";
import { Beach, Region } from "@/app/types/beaches";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FILTERS } from "@/app/config/filters";
import { FilterType } from "@/app/types/filters";

const transformBeachData = (beach: any): Beach => ({
  ...beach,
  // Handle nullable fields
  image: beach.image || "",
  profileImage: beach.profileImage || undefined,
  advertisingPrice: beach.advertisingPrice || undefined,
  hasSharkAlert: beach.hasSharkAlert || undefined,
  bestMonthOfYear: beach.bestMonthOfYear || undefined,
  sheltered: beach.sheltered === null ? undefined : beach.sheltered,
  coffeeShop: (beach.coffeeShop || []) as { name: string }[],
  videos: (beach.videos || []) as {
    url: string;
    title: string;
    platform: "youtube" | "vimeo";
  }[],
  // Handle JSON fields
  coordinates: beach.coordinates as { lat: number; lng: number },
  optimalSwellDirections:
    typeof beach.optimalSwellDirections === "string"
      ? JSON.parse(beach.optimalSwellDirections)
      : beach.optimalSwellDirections,
  swellSize: beach.swellSize as { min: number; max: number },
  idealSwellPeriod: beach.idealSwellPeriod as { min: number; max: number },
  waterTemp: beach.waterTemp as { summer: number; winter: number },
  sharkAttack: beach.sharkAttack as {
    hasAttack: boolean;
    risk: string;
    lastIncident?: string;
  },
  // Enum fields
  crimeLevel: beach.crimeLevel as "Low" | "Medium" | "High",
  optimalTide: beach.optimalTide,
  difficulty: beach.difficulty,
  waveType: beach.waveType,
});

export const useBeachFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = {
    // Handle standard filters
    ...FILTERS.reduce(
      (acc, filter) => {
        const value = searchParams.get(filter.urlParam);
        if (filter.type === "array") {
          acc[filter.key] = value?.split(",") || [];
        } else if (filter.type === "boolean") {
          acc[filter.key] = value === "true";
        } else if (filter.type === "number") {
          acc[filter.key] = value ? Number(value) : 0;
        }
        return acc;
      },
      {} as Record<FilterType, any>
    ),
    // Handle region-related parameters
    regionId: searchParams.get("regionId") || null,
    region: searchParams.get("region") || null,
    country: searchParams.get("country") || null,
    continent: searchParams.get("continent") || null,
  };

  const updateFilter = useCallback(
    (filterType: string, value: string | string[]) => {
      const params = new URLSearchParams(searchParams);

      const region = params.get("regionId");

      if (Array.isArray(value)) {
        if (value.length) {
          params.set(filterType, value.join(","));
        } else {
          params.delete(filterType);
        }
      } else if (value) {
        params.set(filterType, value);
      } else {
        params.delete(filterType);
      }

      if (filters.regionId && filterType !== "regionId") {
        params.set("regionId", filters.regionId);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, filters.regionId]
  );

  const selectRegion = (region: Region | null) => {
    const params = new URLSearchParams(searchParams);

    if (!region) {
      // Clear all region-related params
      params.delete("regionId");
      params.delete("region");
      params.delete("country");
      params.delete("continent");
    } else {
      // Only keep regionId as the source of truth
      const formattedRegionId = region.id.toLowerCase().replace(/\s+/g, "-");
      params.set("regionId", formattedRegionId);

      // Remove redundant params
      params.delete("region");
      params.delete("country");
      params.delete("continent");
    }

    // Always clear searchQuery when changing regions
    params.delete("searchQuery");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const selectBeach = (beach: Beach | null) => {
    const params = new URLSearchParams(searchParams);

    if (!beach) {
      // Clear all beach-related params
      params.delete("regionId");
      params.delete("searchQuery");
      params.delete("region");
      params.delete("country");
      params.delete("continent");
    } else {
      // Set all beach-related params
      params.set("regionId", beach.regionId.toLowerCase());
      params.set("searchQuery", beach.name);

      // Optional UI state params
      if (beach.region?.name) params.set("region", beach.region.name);
      if (beach.region?.country?.name)
        params.set("country", beach.region.country.name);
      if (beach.region?.continent)
        params.set("continent", beach.region.continent);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return {
    filters,
    updateFilter,
    selectRegion,
    selectBeach,
  };
};
