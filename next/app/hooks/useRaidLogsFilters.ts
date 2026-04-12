import { useState, useCallback } from "react";
import { FilterConfig } from "../types/raidlogs";

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => new Date().toISOString().split("T")[0];

export const defaultFilters: FilterConfig = {
  beaches: [],
  regions: [],
  countries: [],
  minRating: null,
  dateRange: { start: getTodayString(), end: getTodayString() },
  isPrivate: false,
  page: 1,
  limit: 50,
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
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };

      // Reset to page 1 if any filter other than page/limit is changed
      const isPaginationUpdate =
        Object.keys(newFilters).length > 0 &&
        Object.keys(newFilters).every((key) => key === "page" || key === "limit");

      if (!isPaginationUpdate && prev.page !== 1) {
        updated.page = 1;
      }

      return updated;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  } as const;
}
