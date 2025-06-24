"use client";

import type { Beach } from "@/app/types/beaches";
import { FilterDrawer } from "@/app/components/ui/filterdrawer";
import { BeachFilter } from "@/app/components/BeachFilter";
import { RegionFilter } from "../RegionFilter";
import { useRegions } from "@/app/hooks/useRegions";
import { RatingFilter } from "@/app/components/RatingFilter";
import { Button } from "@/app/components/ui/Button";

interface RaidLogFilterProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBeachIds: string[];
  selectedRegionIds: string[];
  selectedMinRating: number | null;
  onFilterChange: (filters: Partial<FilterConfig>) => void;
  onReset: () => void;
  beaches: Beach[];
}

interface FilterConfig {
  beaches: string[];
  regions: string[];
  minRating: number | null;
  dateRange: {
    start: string;
    end: string;
  };
  isPrivate: boolean;
}

export function RaidLogFilter({
  isOpen,
  onClose,
  selectedBeachIds,
  selectedRegionIds,
  selectedMinRating,
  onFilterChange,
  onReset,
  beaches,
}: RaidLogFilterProps) {
  const { data: regions = [] } = useRegions();

  return (
    <FilterDrawer isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
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
      <RatingFilter
        minRating={selectedMinRating}
        onChange={(minRating) => onFilterChange({ minRating })}
      />
    </FilterDrawer>
  );
}
