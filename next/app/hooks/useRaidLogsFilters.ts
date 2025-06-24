import { useState, useCallback } from "react";

import { FilterConfig } from "../types/raidlogs";

export const defaultFilters: FilterConfig = {
  beaches: [],
  regions: [],
  countries: [],
  minRating: null,
  dateRange: { start: "", end: "" },
  isPrivate: false,
};

interface UseRaidLogFiltersProps {
  initialFilters?: Partial<FilterConfig>;
}

// hooks/useRaidLogFilters.ts
export function useRaidLogFilters({
  initialFilters,
}: UseRaidLogFiltersProps = {}) {
  const [filters, setFilters] = useState<FilterConfig>({
    ...defaultFilters,
    ...initialFilters,
  });

  const updateFilters = useCallback((newFilters: Partial<FilterConfig>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
    // You can add more filter-related methods here
  } as const;
}
