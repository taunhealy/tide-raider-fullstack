"use client";

import { useState, useCallback } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { Beach } from "@/app/types/beaches";
import { Star } from "lucide-react";

type FilterConfig = {
  beaches: string[];
  regions: string[];
  countries: string[];
  minRating: number;
};

interface RaidLogFilterProps {
  beaches: Beach[];
  selectedBeaches: string[];
  onFilterChange: (filters: Partial<FilterConfig>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function RaidLogFilter({
  beaches,
  selectedBeaches = [],
  onFilterChange,
  isOpen,
  onClose,
}: RaidLogFilterProps) {
  const [beachSearch, setBeachSearch] = useState("");
  const [isBeachOpen, setIsBeachOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Get unique regions and countries from beaches
  const uniqueRegions = Array.from(
    new Set(beaches.map((beach) => beach.region))
  ).sort();
  const uniqueCountries = Array.from(
    new Set(beaches.map((beach) => beach.country))
  ).sort();

  const handleBeachToggle = useCallback(
    (beachName: string) => {
      const newBeaches = selectedBeaches.includes(beachName)
        ? selectedBeaches.filter((b) => b !== beachName)
        : [...selectedBeaches, beachName];
      onFilterChange({ beaches: newBeaches });
    },
    [selectedBeaches, onFilterChange]
  );

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    onFilterChange({ minRating: rating });
  };

  const handleRegionToggle = (region: string) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter((r) => r !== region)
      : [...selectedRegions, region];
    setSelectedRegions(newRegions);
    onFilterChange({ regions: newRegions });
  };

  const handleCountryToggle = (country: string) => {
    const newCountries = selectedCountries.includes(country)
      ? selectedCountries.filter((c) => c !== country)
      : [...selectedCountries, country];
    setSelectedCountries(newCountries);
    onFilterChange({ countries: newCountries });
  };

  const filteredBeaches = beaches.filter((beach) =>
    beach.name.toLowerCase().includes(beachSearch.toLowerCase())
  );

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-full sm:w-[360px] bg-white transform transition-transform duration-300 ease-in-out z-50 shadow-lg",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="flex justify-between items-center p-3 sm:p-6 border-b">
        <h2 className="text-base sm:text-lg font-semibold font-primary">
          Filter Raids
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-70px)]">
        {/* Star Rating Filter */}
        <div className="filter-section">
          <h3 className="text-sm font-medium mb-3">Minimum Rating</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingSelect(rating)}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  selectedRating === rating
                    ? "bg-[var(--brand-tertiary)] text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    selectedRating === rating
                      ? "fill-gray-600"
                      : "fill-gray-400"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Region Filter */}
        <div className="filter-section">
          <button
            onClick={() => setIsRegionOpen(!isRegionOpen)}
            className="w-full flex justify-between items-center p-2 border rounded-md hover:bg-gray-50"
          >
            <span>Regions ({selectedRegions.length})</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isRegionOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isRegionOpen && (
            <div className="mt-2 border rounded-md p-2 max-h-[240px] overflow-y-auto">
              {uniqueRegions.map((region) => (
                <label
                  key={region}
                  className="flex items-center p-2 hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedRegions.includes(region)}
                    onChange={() => handleRegionToggle(region)}
                    className="mr-2"
                  />
                  <span className="text-sm">{region}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Beach Filter */}
        <div className="filter-section">
          <button
            onClick={() => setIsBeachOpen(!isBeachOpen)}
            className="w-full flex justify-between items-center p-2 border rounded-md hover:bg-gray-50"
          >
            <span>Beaches ({selectedBeaches.length})</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isBeachOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isBeachOpen && (
            <div className="mt-2 border rounded-md">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search beaches..."
                  value={beachSearch}
                  onChange={(e) => setBeachSearch(e.target.value)}
                  className="w-full p-2 mb-2 border rounded-md"
                />
                <div className="max-h-[240px] overflow-y-auto">
                  {filteredBeaches.map((beach) => (
                    <label
                      key={beach.id}
                      className="flex items-center p-2 hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBeaches.includes(beach.name)}
                        onChange={() => handleBeachToggle(beach.name)}
                        className="mr-2"
                      />
                      <span className="text-sm">{beach.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Filters Display */}
        {(selectedBeaches.length > 0 ||
          selectedRegions.length > 0 ||
          selectedRating > 0) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Active Filters</h3>
            <div className="flex flex-wrap gap-2">
              {selectedBeaches.map((beach) => (
                <div
                  key={beach}
                  className="flex items-center bg-gray-100 px-3 py-1 rounded-md text-sm"
                >
                  {beach}
                  <button
                    onClick={() => handleBeachToggle(beach)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {selectedRegions.map((region) => (
                <div
                  key={region}
                  className="flex items-center bg-gray-100 px-3 py-1 rounded-md text-sm"
                >
                  {region}
                  <button
                    onClick={() => handleRegionToggle(region)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {selectedRating > 0 && (
                <div className="flex items-center bg-gray-100 px-3 py-1 rounded-md text-sm">
                  {`${selectedRating}+ Stars`}
                  <button
                    onClick={() => handleRatingSelect(0)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
