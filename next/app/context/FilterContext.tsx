import { createContext, useContext } from "react";
import type { RegionUI } from "@/app/types/regions";
import type { Beach } from "@/app/types/beaches";
import type { FilterConfig } from "@/app/types/filters";
import { useBeaches } from "../hooks/useBeaches";

export const FilterContext = createContext<{
  regions: RegionUI[];
  beaches: Beach[];
  filters: FilterConfig;
  onFilterChange: (filters: Partial<FilterConfig>) => void;
}>(null!);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { data: regions } = useRegions();
  const { data: beaches } = useBeaches();
  // ... state management

  return (
    <FilterContext.Provider
      value={{ regions, beaches, filters, onFilterChange }}
    >
      {children}
    </FilterContext.Provider>
  );
}

// Custom hook for consuming the context
export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
}
