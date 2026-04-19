"use client";

import { useState, useEffect } from "react";
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
import { Filter, Lock } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { FilterDrawer } from "@/app/components/ui/filterdrawer";
import LocationFilter from "../LocationFilter";
import { useRegions } from "@/app/hooks/useRegions";
import { cn } from "@/app/lib/utils";
import { Slider } from "@/app/components/ui/slider";
import { TimeSlot } from "@/app/types/forecast";
import TimeSlotSelector from "../stream/TimeSlotSelector";

interface BeachHeaderControlsProps {
  onSearch: (value: string) => void;
  onRegionSelect: (regionId: LocationFilterType["regionId"]) => void;
  currentRegion: string;
  beaches: Beach[];
  availableDates: string[];
  maxDistance: number | null;
  onMaxDistanceChange: (val: number | null) => void;
  onToggleProximity: () => void;
  isLocating: boolean;
  isAuthenticated: boolean;
  isSubscribed: boolean;
}

const ProximityFilterRow = ({ 
  maxDistance, 
  onChange, 
  onToggle,
  isLocating 
}: { 
  maxDistance: number | null; 
  onChange: (val: number) => void;
  onToggle: () => void;
  isLocating: boolean;
}) => (
  <div className="mt-4 pt-4 border-t border-gray-100/60 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h5 className="font-primary text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Proximity
        </h5>
        {maxDistance !== null && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-3/10 text-brand-3 rounded-full">
             <input
              type="number"
              value={maxDistance}
              onChange={(e) => onChange(parseInt(e.target.value) || 0)}
              className="w-10 bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 appearance-none"
              min={0}
              max={100}
            />
            <span className="text-[10px] font-bold">km Radius</span>
          </div>
        )}
      </div>
      
      <button
        onClick={onToggle}
        disabled={isLocating}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-primary text-[9px] font-black uppercase tracking-wider border",
          maxDistance !== null 
            ? "bg-brand-3 border-brand-3 text-white shadow-sm" 
            : "bg-white border-gray-200 text-gray-400 hover:border-brand-3 hover:text-brand-3"
        )}
      >
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          maxDistance !== null ? "bg-white animate-pulse" : "bg-gray-300"
        )} />
        {isLocating ? "Locating..." : maxDistance !== null ? "Enabled" : "Enable Filter"}
      </button>
    </div>
    
    {maxDistance !== null && (
      <div className="flex items-center gap-6 px-1">
        <Slider
          value={[Math.min(maxDistance, 100)]}
          max={100}
          min={5}
          step={5}
          onValueChange={(vals) => onChange(vals[0])}
          className="flex-1"
        />
        <div className="flex flex-col items-end min-w-[40px]">
          <span className="text-[12px] font-bold text-black">{maxDistance > 100 ? "100+" : `${maxDistance}km`}</span>
          <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">MAX</span>
        </div>
      </div>
    )}
  </div>
);

export default function BeachHeaderControls({
  onSearch,
  onRegionSelect,
  currentRegion,
  beaches,
  availableDates,
  maxDistance,
  onMaxDistanceChange,
  onToggleProximity,
  isLocating,
  isAuthenticated,
  isSubscribed,
}: BeachHeaderControlsProps) {
  // Manage filter sidebar state locally
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { data: regions = [] } = useRegions();
  const searchParams = useSearchParams();
  const { data: regionCountsData } = useRegionCounts();
  const { filters, updateFilter } = useBeachFilters();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get selected date from URL params or default to today
  const selectedDate = searchParams.get("forecastDate");

  const handleDateSelect = (date: string) => {
    updateFilter("forecastDate", date);
  };

  // Time Slot Intelligence
  const [activeSlot, setActiveSlot] = useState<TimeSlot>(TimeSlot.MORNING);
  const currentTimeSlotValue = (filters.timeSlot as TimeSlot) || TimeSlot.MORNING;

  useEffect(() => {
    // Synchronize current time with active slot
    const hour = new Date().getHours();
    let slot = TimeSlot.MORNING;
    if (hour >= 11 && hour < 16) slot = TimeSlot.NOON;
    else if (hour >= 16) slot = TimeSlot.EVENING;
    setActiveSlot(slot);
    
    // Set initial default if not in URL
    if (!filters.timeSlot) {
       updateFilter("timeSlot", slot);
    }
  }, []);

  // Default to today if no date is in the URL
  const [hasDefaulted, setHasDefaulted] = useState(false);
  
  useEffect(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Force Today if no date in URL OR if the date in URL is in the past
    const isPastDate = selectedDate && selectedDate < todayStr;

    if ((!selectedDate || isPastDate) && availableDates.length > 0 && !hasDefaulted) {
      if (availableDates.includes(todayStr)) {
        handleDateSelect(todayStr);
      } else {
        // Fallback to the first available date (usually today or tomorrow)
        handleDateSelect(availableDates[0]);
      }
      setHasDefaulted(true);
    }
  }, [selectedDate, availableDates, hasDefaulted]);

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"></div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
               <DateSelector
                 selectedDate={selectedDate}
                 onDateSelect={handleDateSelect}
                 beaches={beaches}
                 availableDates={availableDates}
               />
               
               <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Tactical Window</label>
                 <TimeSlotSelector 
                   selectedSlot={currentTimeSlotValue}
                   onChange={(slot) => updateFilter("timeSlot", slot)}
                   activeSlot={activeSlot}
                 />
               </div>
            </div>

            <div className="h-px bg-black/5 w-full" />

            <div className="flex flex-col sm:flex-row items-start sm:items-start gap-3">
              <div className="flex flex-col w-full sm:w-auto flex-1 gap-3 min-w-0">
                {/* Search Bar */}
                <div className="w-full overflow-visible px-1">
                  <SearchBar />
                </div>
                
                <div className="flex flex-col gap-4 w-full">
                  {/* Recent Regions Row */}
                  <div className="w-full space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Location History</label>
                    <RecentRegionSearch regionCounts={regionCountsData} />
                  </div>
                  
                  <div className="h-px bg-black/5 w-full" />
                  
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
                    >
                      Loggers Only
                    </LoggersButton>

                    <FoilingButton
                      active={!!filters.isFoiling}
                      size="sm"
                      onClick={() => {
                        const newValue = !filters.isFoiling;
                        updateFilter("isFoiling", newValue ? "true" : "");
                      }}
                    >
                      Foiling Only
                    </FoilingButton>

                    <HiddenGemsButton
                      active={!!filters.isHiddenGem}
                      size="sm"
                      onClick={() => {
                        if (!isAuthenticated) {
                           // Trigger login
                           alert("Sign in to discover Hidden Gems");
                           return;
                        }
                        if (!isSubscribed) {
                           // Trigger subscription modal or alert
                           alert("Subscription required to access community Hidden Gems.");
                           return;
                        }
                        const newValue = !filters.isHiddenGem;
                        updateFilter("isHiddenGem", newValue ? "true" : "");
                      }}
                      className={cn(
                        (!isAuthenticated || !isSubscribed) && "opacity-50 grayscale cursor-not-allowed"
                      )}
                      title={
                        !isAuthenticated 
                          ? "Sign in to view Hidden Gems" 
                          : !isSubscribed 
                            ? "Subscription required for Hidden Gems" 
                            : "Show community hidden gems"
                      }
                    >
                      Hidden Gems
                      {(!isAuthenticated || !isSubscribed) && <Lock className="ml-2 w-3 h-3" />}
                    </HiddenGemsButton>
                  </div>

                  {isMounted && (
                    <ProximityFilterRow 
                      maxDistance={maxDistance}
                      onChange={onMaxDistanceChange}
                      onToggle={onToggleProximity}
                      isLocating={isLocating}
                    />
                  )}
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
