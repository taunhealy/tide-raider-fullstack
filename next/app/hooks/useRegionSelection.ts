import { useState } from "react";

// hooks/useRegion.ts
export function useRegion(options?: {
  onRegionChange?: (region: string | null) => void;
  initialRegions?: string[];
}) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>(options?.initialRegions || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegionChange = (region: string | null) => {
    setSelectedRegion(region);
    options?.onRegionChange?.(region);
  };

  return {
    selectedRegion,
    regions,
    isLoading,
    handleRegionChange
  };
}