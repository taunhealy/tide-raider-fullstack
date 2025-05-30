// hooks/useBeachAttributes.ts
import { useMemo, useCallback } from 'react';
import type { Beach } from '@/app/types/beaches';

export function useBeachAttributes(initialBeaches: Beach[]) {
  // Extract unique regions, continents, countries, and wave types
  const uniqueRegions = useMemo(() => 
    Array.from(new Set(initialBeaches.map((beach) => beach.region))).sort(),
    [initialBeaches]
  );
  
  const uniqueContinents = useMemo(() => 
    Array.from(new Set(initialBeaches.map((beach) => beach.continent))).sort(),
    [initialBeaches]
  );
  
  const uniqueCountries = useMemo(() => 
    Array.from(new Set(initialBeaches.map((beach) => beach.country))).sort(),
    [initialBeaches]
  );
  
  const waveTypes = useMemo(() => 
    [...new Set(initialBeaches.map((beach) => beach.waveType))],
    [initialBeaches]
  );
  
  // Utility function to fetch region data
  const fetchRegionData = useCallback(async (region: string) => {
    try {
      const response = await fetch(`/api/wind-data?region=${region}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching wind data:", error);
      return null;
    }
  }, []);
  
  return {
    uniqueRegions,
    uniqueContinents,
    uniqueCountries,
    waveTypes,
    fetchRegionData
  };
}