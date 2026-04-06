"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "../SearchBar";
import RecentRegionSearch from "../RecentRegionSearch";
import DateSelector from "./DateSelector";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import WeatherForecastWidget from "../sidebar/WeatherForecastWidget";

import { Beach } from "@/app/types/beaches";
import { FilterToggleButton } from "@/app/components/ui/FilterToggleButton";
import { LocationFilter as LocationFilterType } from "@/app/types/filters";
import { useRegionCounts } from "@/app/hooks/useRegionCounts";
import { HiddenGemsButton, LoggersButton, FoilingButton } from "@/app/components/ui/GradientButton";
import { Filter } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { FilterDrawer } from "@/app/components/ui/filterdrawer";
import LocationFilter from "../LocationFilter";
import { useRegions } from "@/app/hooks/useRegions";

interface BeachHeaderControlsProps {
  onSearch: (value: string) => void;
  onRegionSelect: (regionId: LocationFilterType["regionId"]) => void;
  currentRegion: string;
  beaches: Beach[];
}

export default function BeachHeaderControls({
  onSearch,
  onRegionSelect,
  currentRegion,
  beaches,
}: BeachHeaderControlsProps) {
  // Manage filter sidebar state locally
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { data: regions = [] } = useRegions();
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
              beaches={beaches}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3">
              <div className="flex flex-col w-full sm:w-auto flex-1 gap-3 min-w-0">
                {/* Search Bar */}
                <div className="w-full overflow-visible px-1">
                  <SearchBar />
                </div>
                
                <div className="flex flex-col gap-3 w-full">
                  {/* Recent Regions Row */}
                  <div className="w-full space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Location History</label>
                    <RecentRegionSearch regionCounts={regionCountsData} />
                  </div>
                  
                  {/* Filters Row - Balanced and professional */}
                  <div className="flex flex-wrap items-center gap-2 px-1">
                    {/* Mobile Filter Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden flex items-center gap-2 bg-white"
                      onClick={() => setIsFilterOpen(true)}
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                    </Button>

                    <LoggersButton
                      active={!!filters.isLongboarding}
                      size="sm"
                      title="Quickly filter by waves good for long boarding"
                      onClick={() => {
                        const newValue = !filters.isLongboarding;
                        updateFilter("isLongboarding", newValue ? "true" : "");
                      }}
                      className="uppercase tracking-wider font-black text-[10px]"
                    >
                      LOGGERS
                    </LoggersButton>

                    <FoilingButton
                      active={!!filters.isFoiling}
                      size="sm"
                      onClick={() => {
                        const newValue = !filters.isFoiling;
                        updateFilter("isFoiling", newValue ? "true" : "");
                      }}
                      className="uppercase tracking-wider font-black text-[10px]"
                    >
                      FOILING
                    </FoilingButton>

                    <HiddenGemsButton
                      active={!!filters.isHiddenGem}
                      size="sm"
                      onClick={() => {
                        const newValue = !filters.isHiddenGem;
                        updateFilter("isHiddenGem", newValue ? "true" : "");
                      }}
                      className="uppercase tracking-wider font-black text-[10px]"
                    >
                      HIDDEN GEMS
                    </HiddenGemsButton>
                  </div>
                </div>

                {/* Mobile Forecast Widget - Below Region Selection */}
                <div className="lg:hidden">
                  <WeatherForecastWidget />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Include FilterSidebar directly in this component */}
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
        <LocationFilter regions={regions} />
      </FilterDrawer>
    </>
  );
}
