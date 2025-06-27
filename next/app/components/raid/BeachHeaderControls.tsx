"use client";

import { useSearchParams } from "next/navigation";
import SearchBar from "../SearchBar";
import RecentRegionSearch from "../RecentRegionSearch";
import { cn } from "@/app/lib/utils";
import { Beach } from "@/app/types/beaches";

interface BeachHeaderControlsProps {
  showFilters: boolean;
  onToggleFilters: (show: boolean) => void;
  onSearch: (value: string) => void;
  onRegionSelect: (regionId: string) => void;
  currentRegion: string;
  beaches: Beach[];
}

export default function BeachHeaderControls({
  showFilters,
  onToggleFilters,

  currentRegion,
  beaches,
}: BeachHeaderControlsProps) {
  const searchParams = useSearchParams();

  // Get current filter values from URL
  const currentWaveTypes = searchParams.get("waveType")?.split(",") || [];
  const currentDifficulty = searchParams.get("difficulty")?.split(",") || [];

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
              <SearchBar beaches={beaches} placeholder="Search breaks..." />
              <RecentRegionSearch
                selectedRegionId={currentRegion}
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
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
