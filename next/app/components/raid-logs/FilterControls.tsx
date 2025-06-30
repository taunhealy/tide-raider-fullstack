"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Beach } from "@/app/types/beaches";
import { Region } from "@/app/types/beaches";
import { FilterConfig } from "@/app/types/raidlogs";
import { Star } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface FilterControlsProps {
  beaches: Beach[];
  regions: Region[];
  selectedBeaches: string[];
  selectedRegions: string[];
  selectedMinRating: number | null;
  onFilterChange: (filters: Partial<FilterConfig>) => void;
}

export function FilterControls({
  beaches,
  regions,
  selectedBeaches,
  selectedRegions,
  selectedMinRating,
  onFilterChange,
}: FilterControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredBeaches = beaches.filter((beach) =>
    beach.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBeach = (beach: Beach) => {
    if (!selectedBeaches.includes(beach.id)) {
      onFilterChange({ beaches: [...selectedBeaches, beach.id] });
    }
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleRemoveBeach = (beachId: string) => {
    onFilterChange({
      beaches: selectedBeaches.filter((id) => id !== beachId),
    });
  };

  const handleSelectRegion = (regionId: string) => {
    const newRegions = selectedRegions.includes(regionId)
      ? selectedRegions.filter((id) => id !== regionId)
      : [...selectedRegions, regionId];
    onFilterChange({ regions: newRegions });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ minRating: rating === selectedMinRating ? null : rating });
  };

  return (
    <div className="space-y-6 p-5">
      {/* Beach Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Beach</label>
        <div className="relative">
          <div className="flex items-center border rounded-md">
            <Search className="h-4 w-4 ml-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search beaches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="p-2 w-full font-primary text-sm focus:outline-none"
            />
          </div>
          {showSuggestions && searchQuery && (
            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
              {filteredBeaches.map((beach) => (
                <div
                  key={beach.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectBeach(beach)}
                >
                  {beach.name}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Selected Beaches */}
        <div className="flex flex-wrap gap-2">
          {selectedBeaches.map((beachId) => {
            const beach = beaches.find((b) => b.id === beachId);
            return beach ? (
              <div
                key={beach.id}
                className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full text-sm"
              >
                <span>{beach.name}</span>
                <button
                  onClick={() => handleRemoveBeach(beach.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Region Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Regions</label>
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => handleSelectRegion(region.id)}
              className={cn(
                "px-3 py-1 rounded-full text-sm",
                selectedRegions.includes(region.id)
                  ? "bg-[var--cyan] text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              )}
            >
              {region.name}
            </button>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Minimum Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingChange(rating)}
              className={cn(
                "p-1",
                rating <= (selectedMinRating || 0)
                  ? "text-yellow-400"
                  : "text-gray-300"
              )}
            >
              <Star className="w-6 h-6 fill-current" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
