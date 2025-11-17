"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "../SearchBar";
import RecentRegionSearch from "../RecentRegionSearch";
import DateSelector from "./DateSelector";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";

import { Beach } from "@/app/types/beaches";
import { FilterToggleButton } from "@/app/components/ui/FilterToggleButton";
import { LocationFilter } from "@/app/types/filters";
import { useRegionCounts } from "@/app/hooks/useRegionCounts";

interface BeachHeaderControlsProps {
  onSearch: (value: string) => void;
  onRegionSelect: (regionId: LocationFilter["regionId"]) => void;
  currentRegion: string;
  beaches: Beach[];
}

export default function BeachHeaderControls({}: BeachHeaderControlsProps) {
  // Manage filter sidebar state locally
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  const { data: regionCountsData } = useRegionCounts();
  const { filters, updateFilter } = useBeachFilters();

  // Get selected date from URL params or default to today
  const selectedDate = searchParams.get("forecastDate");

  const handleDateSelect = (date: string) => {
    updateFilter("forecastDate", date);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"></div>

          <div className="flex flex-col gap-3">
            {/* Date Selector - Above Search Bar */}
            <DateSelector
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3">
              <div className="flex flex-col w-full sm:w-auto flex-1 gap-3">
                <SearchBar />
                <RecentRegionSearch regionCounts={regionCountsData} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Include FilterSidebar directly in this component */}
    </>
  );
}
