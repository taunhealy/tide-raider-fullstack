"use client";

import { cn } from "@/app/lib/utils";
import SearchBar from "../SearchBar";
import RecentRegionSearch from "../RecentRegionSearch";
import type { Beach, FilterType } from "@/app/types/beaches";
import type { Region } from "@/app/types/regions";

interface BeachHeaderControlsProps {
  showFilters: boolean;
  onToggleFilters: (show: boolean) => void;
  beaches: Beach[];
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export default function BeachHeaderControls({
  showFilters,
  onToggleFilters,
  beaches,
  filters,
  onFiltersChange,
}: BeachHeaderControlsProps) {
  const filteredBeaches = beaches.filter((beach) =>
    beach.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
  );

  const handleSearch = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleBeachSelect = (beach: Beach) => {
    onFiltersChange({
      ...filters,
      searchQuery: beach.name,
      location: {
        ...filters.location,
        region: beach.region?.name || "",
        regionId: beach.regionId || "",
        country: beach.countryId || "",
        continent: beach.continent || "",
      },
    });
  };

  const handleRegionSelect = (region: Region) => {
    console.log("Region selected in BeachHeaderControls:", region);
    onFiltersChange({
      ...filters,
      location: {
        ...filters.location,
        region: region.name,
        regionId: region.id,
        country: region.country || "",
        continent: region.continent || "",
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-xl sm:text-2xl font-semi-bold text-[var(--color-text-primary)] font-primary">
            Surf Breaks
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3">
            <div className="w-full sm:w-auto flex-1">
              <SearchBar
                value={filters.searchQuery}
                onSearch={handleSearch}
                onBeachSelect={handleBeachSelect}
                suggestions={filteredBeaches}
                placeholder="Search breaks..."
              />
              <RecentRegionSearch
                selectedRegionId={filters.location.regionId}
                onRegionSelect={handleRegionSelect}
                className="mt-2"
              />
            </div>
            <button
              onClick={() => onToggleFilters(!showFilters)}
              className={cn(
                "font-primary",
                "text-black font-semibold",
                "bg-white border border-gray-200",
                "px-4 py-2",
                "rounded-[21px]",
                "flex items-center gap-2",
                "hover:bg-gray-50 transition-colors",
                "w-full sm:w-auto justify-center sm:justify-start",
                "mt-0 sm:mt-0"
              )}
            >
              <span>Filters</span>
              {Object.values(filters).some((f) =>
                Array.isArray(f) ? f.length > 0 : f !== 0
              ) && (
                <span className="w-2 h-2 rounded-full bg-[var(--color-bg-tertiary)]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
