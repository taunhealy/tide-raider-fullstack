"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "../SearchBar";
import RecentRegionSearch from "../RecentRegionSearch";
import { Button } from "@/app/components/ui/Button";
import FilterSidebar from "../filters/FiltersSidebar";
import { Beach } from "@/app/types/beaches";

interface BeachHeaderControlsProps {
  onSearch: (value: string) => void;
  onRegionSelect: (regionId: string) => void;
  currentRegion: string;
  beaches: Beach[];
}

export default function BeachHeaderControls({}: BeachHeaderControlsProps) {
  // Manage filter sidebar state locally
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"></div>

          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3">
              <div className="flex flex-col w-full sm:w-auto flex-1 gap-3">
                <SearchBar />
                <RecentRegionSearch />
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className="border border-gray-200 rounded-[21px] w-full sm:w-auto justify-center sm:justify-start"
              >
                <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Include FilterSidebar directly in this component */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </>
  );
}
