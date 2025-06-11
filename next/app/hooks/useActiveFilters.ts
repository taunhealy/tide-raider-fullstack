import { useMemo } from "react";
import type { FilterConfig } from "@/app/types/raidlogs";

export function useActiveFilters(
  filters: FilterConfig,
  onFilterChange: (filters: Partial<FilterConfig>) => void
) {
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.beaches?.length || 0) > 0 ||
      (filters.regions?.length || 0) > 0 ||
      (filters.countries?.length || 0) > 0 ||
      (filters.minRating || 0) > 0
    );
  }, [filters]);

  const removeBeachFilter = (beach: string) => {
    onFilterChange({
      beaches: filters.beaches?.filter((b) => b !== beach) || [],
    });
  };

  const removeRegionFilter = (region: string) => {
    onFilterChange({
      regions: filters.regions?.filter((r) => r !== region) || [],
    });
  };

  const removeCountryFilter = (country: string) => {
    onFilterChange({
      countries: filters.countries?.filter((c) => c !== country) || [],
    });
  };

  const removeRatingFilter = () => {
    onFilterChange({
      minRating: 0,
    });
  };

  return {
    hasActiveFilters,
    activeFilters: filters,
    removeBeachFilter,
    removeRegionFilter,
    removeCountryFilter,
    removeRatingFilter,
  };
}
