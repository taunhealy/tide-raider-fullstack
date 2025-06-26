"use client";

import { useBeachData } from "@/app/hooks/useBeachData";
import { useBeachContext } from "@/app/context/BeachContext";
import SearchBar from "../SearchBar";
import RecentRegionSearch from "../RecentRegionSearch";
import { cn } from "@/app/lib/utils";

interface BeachHeaderControlsProps {
  showFilters: boolean;
  onToggleFilters: (show: boolean) => void;
}

export default function BeachHeaderControls({
  showFilters,
  onToggleFilters,
}: BeachHeaderControlsProps) {
  const { filters, updateFilters } = useBeachContext();
  const { beaches } = useBeachData();

  const filteredBeaches = beaches.filter((beach) =>
    beach.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
  );

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
                onSearch={(value) =>
                  updateFilters({ ...filters, searchQuery: value })
                }
                suggestions={filteredBeaches}
                placeholder="Search breaks..."
              />
              <RecentRegionSearch
                selectedRegionId={filters.regionId}
                onRegionSelect={(region) => {
                  updateFilters({
                    ...filters,
                    regionId: region.id,
                    region: region.name,
                    country: region.country?.name || "",
                    continent: region.continent || "",
                  });
                }}
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
