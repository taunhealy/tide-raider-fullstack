import { useCallback } from "react";

import { useState } from "react";

import { FilterConfig } from "../types/raidlogs";

// hooks/useRaidLogFilter.ts
export function useRaidLogFilter(initialFilters: FilterConfig) {
  const [filters, setFilters] = useState<FilterConfig>(initialFilters);

  const updateFilter = useCallback((key: keyof FilterConfig, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { filters, updateFilter };
}
