// hooks/useRegionSelection.ts (expand your existing hook)
import { useState } from 'react';
import type { Region, FilterType } from '@/app/types/beaches';

export function useRegionSelection(
  filters: FilterType,
  setFilters: (filters: FilterType) => void
) {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    const newFilters = { ...filters };
    newFilters.region = [newRegion as Region];
    setFilters(newFilters);

    // Set loading state
    setIsLoadingRegion(true);

    // Reset loading state after data is loaded or after timeout
    setTimeout(() => {
      setIsLoadingRegion(false);
    }, 3500);
  };

  return {
    selectedRegion,
    isLoadingRegion,
    handleRegionChange
  };
}