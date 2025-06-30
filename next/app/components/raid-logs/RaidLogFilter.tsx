"use client";

import { FilterDrawer } from "@/app/components/ui/filterdrawer";
import { useRegions } from "@/app/hooks/useRegions";
import { useBeaches } from "@/app/hooks/useBeaches";
import { Button } from "@/app/components/ui/Button";
import { FilterConfig } from "@/app/types/raidlogs";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { FilterControls } from "./FilterControls";

interface RaidLogFilterProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBeachIds: string[];
  selectedRegionIds: string[];
  selectedMinRating: number | null;
  onFilterChange: (filters: Partial<FilterConfig>) => void;
  onReset: () => void;
}

export function RaidLogFilter({
  isOpen,
  onClose,
  selectedBeachIds,
  selectedRegionIds,
  selectedMinRating,
  onFilterChange,
  onReset,
}: RaidLogFilterProps) {
  const { data: regions = [] } = useRegions();
  const { data: beaches, isLoading } = useBeaches();

  if (isLoading) {
    return <RandomLoader isLoading={true} />;
  }

  return (
    <FilterDrawer isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
      <FilterControls
        beaches={beaches || []}
        regions={regions}
        selectedBeaches={selectedBeachIds}
        selectedRegions={selectedRegionIds}
        selectedMinRating={selectedMinRating}
        onFilterChange={onFilterChange}
      />
    </FilterDrawer>
  );
}
