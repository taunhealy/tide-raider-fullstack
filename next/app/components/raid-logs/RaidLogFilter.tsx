"use client";

import type { Beach } from "@/app/types/beaches";
import { FilterDrawer } from "@/app/components/ui/filterdrawer";
import { BeachFilter } from "@/app/components/BeachFilter";
import { RegionFilter } from "../RegionFilter";
import { useRegions } from "@/app/hooks/useRegions";
import { RatingFilter } from "@/app/components/RatingFilter";

type FilterConfig = {
  beaches: string[];
  regions: string[];
  countries: string[];
  minRating: number;
};

interface RaidLogFilterProps {
  beaches: Beach[];
  selectedBeachIds: string[];
  selectedRegionIds: string[];
  onFilterChange: (newFilters: Partial<FilterConfig>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function RaidLogFilter({
  selectedBeachIds,
  selectedRegionIds,
  onFilterChange,
  beaches,
  isOpen,
  onClose,
}: RaidLogFilterProps) {
  const { data: regions = [] } = useRegions();

  return (
    <FilterDrawer isOpen={isOpen} onClose={onClose}>
      <BeachFilter
        selectedBeaches={selectedBeachIds}
        onChange={(beaches) => onFilterChange({ beaches })}
        beaches={beaches}
      />
      <RegionFilter
        selectedRegions={selectedRegionIds}
        onChange={(regions) => onFilterChange({ regions })}
        regions={regions}
      />
      <RatingFilter />
    </FilterDrawer>
  );
}
