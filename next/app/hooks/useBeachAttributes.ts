// hooks/useBeachAttributes.ts
import { useMemo, useCallback } from "react";
import type { Beach } from "@/app/types/beaches";

interface RegionObject {
  name: string;
}

export function useBeachAttributes(initialBeaches: Beach[]) {
  // Extract unique regions with both id and name
  const uniqueRegions = useMemo(() => {
    const regionMap = new Map();

    (initialBeaches || []).forEach((beach) => {
      if (beach.region && beach.regionId) {
        regionMap.set(beach.regionId, {
          id: beach.regionId,
          name: beach.region.name,
          countryId: beach.region.countryId,
          continent: beach.region.continent,
        });
      }
    });

    return Array.from(regionMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [initialBeaches]);

  const uniqueContinents = useMemo(
    () =>
      Array.from(
        new Set((initialBeaches || []).map((beach) => beach.continent))
      ).sort(),
    [initialBeaches]
  );

  const uniqueCountries = useMemo(
    () =>
      Array.from(
        new Set((initialBeaches || []).map((beach) => beach.country))
      ).sort(),
    [initialBeaches]
  );

  const waveTypes = useMemo(
    () => [...new Set((initialBeaches || []).map((beach) => beach.waveType))],
    [initialBeaches]
  );

  // Utility function to fetch region data
  const fetchRegionData = useCallback(async (region: string) => {
    try {
      const response = await fetch(`/api/forecast?region=${region}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      return null;
    }
  }, []);

  return {
    uniqueRegions,
    uniqueContinents,
    uniqueCountries,
    waveTypes,
    fetchRegionData,
  };
}
