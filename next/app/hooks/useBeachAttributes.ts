// hooks/useBeachAttributes.ts
import { useMemo, useCallback } from "react";
import { Beach } from "@prisma/client";

interface RegionObject {
  name: string;
}

export function useBeachAttributes(initialBeaches: Beach[]) {
  // Extract unique regions with both id and name
  const uniqueRegions = useMemo(() => {
    const regionMap = new Map();

    (initialBeaches || []).forEach((beach) => {
      if (beach.regionId) {
        regionMap.set(beach.regionId, {
          id: beach.regionId,
          name: beach.name,
          countryId: beach.countryId,
          continent: beach.continent,
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
        new Set((initialBeaches || []).map((beach) => beach.countryId))
      ).sort(),
    [initialBeaches]
  );

  const waveTypes = useMemo(
    () =>
      Array.from(
        new Set(initialBeaches.map((beach) => beach.waveType as string))
      ).filter(Boolean),
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
