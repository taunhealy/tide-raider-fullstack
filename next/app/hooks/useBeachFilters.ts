import { useMemo, useCallback } from "react";
import { Beach, Region } from "@/app/types/beaches";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface BeachFilters {
  regionId: string;
  waveTypes: string[];
  difficulty: string[];
  hasSharkAlert: boolean;
  country: string;
  continent: string;
  region: string;
  searchQuery: string;
}

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
    regionId: searchParams.get("regionId")?.toLowerCase() || "",
    waveTypes: searchParams.get("waveType")?.split(",") || [],
    difficulty: searchParams.get("difficulty")?.split(",") || [],
    hasSharkAlert: searchParams.get("hasSharkAlert") === "true",
    country: searchParams.get("country") || "",
    continent: searchParams.get("continent") || "",
    region: searchParams.get("region") || "",
    searchQuery: searchParams.get("searchQuery") || "",
  };

  const updateFilter = useCallback(
    (filterType: string, value: string | string[]) => {
      console.log(`updateFilter called: ${filterType} = ${value}`);

      const params = new URLSearchParams(searchParams);
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

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const selectRegion = useCallback(
    (region: Region | null) => {
      console.log("selectRegion called with:", region);

      // Create a single URLSearchParams instance
      const params = new URLSearchParams(searchParams);

      if (region) {
        // Update all region-related parameters at once
        params.set("regionId", region.id.toLowerCase());
        params.set("region", region.name);
        if (region.country) {
          params.set("country", region.country.name || "");
        }
        if (region.continent) {
          params.set("continent", region.continent || "");
        } else {
          params.delete("continent");
        }
      } else {
        // Clear all region-related parameters at once
        params.delete("regionId");
        params.delete("region");
        params.delete("country");
        params.delete("continent");
      }

      // Make a single router.push call with all parameter changes
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return {
    filters,
    updateFilter,
    selectRegion,
  };
};
