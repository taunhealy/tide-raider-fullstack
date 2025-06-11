import { Search } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { useBeach } from "@/app/context/BeachContext";
import type { Beach, FilterType } from "@/app/types/beaches";
import RecentRegionSearch from "./RecentRegionSearch";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search breaks...",
  className,
}: SearchBarProps) {
  const { beaches, filters, setFilters } = useBeach();
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Create debounced function once and clean it up properly
  const debouncedUpdate = useRef(
    debounce((value: string) => {
      onChange(value);
    }, 300)
  ).current;

  // Filter beaches based on search input
  const filteredBeaches = beaches.filter((beach) =>
    beach.name.toLowerCase().includes(localValue.toLowerCase())
  );

  // Handle beach selection
  const handleBeachSelect = (beach: Beach) => {
    setLocalValue(beach.name);
    onChange(beach.name);
    setShowSuggestions(false);
    // Update region filter when beach is selected
    setFilters({
      ...filters,
      location: {
        ...filters.location,
        region: beach.region?.name || "",
        regionId: beach.regionId || "",
        country: beach.countryId || "",
        continent: beach.continent || "",
      },
    });
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  // Keep local value in sync with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="space-y-3">
      <div className={cn("relative w-full max-w-md font-primary", className)}>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={localValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setLocalValue(newValue);
            setShowSuggestions(true);
            debouncedUpdate(newValue);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow click events to register
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg",
            "focus:outline-none focus:ring-1 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent",
            "placeholder-gray-400 transition-all ml-1"
          )}
        />

        {/* Beach Suggestions */}
        {showSuggestions && localValue && filteredBeaches.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredBeaches.map((beach) => (
              <div
                key={beach.id}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleBeachSelect(beach)}
              >
                <div className="font-medium">{beach.name}</div>
                <div className="text-sm text-gray-500">
                  {beach.region?.name}, {beach.countryId}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Regions */}
      <RecentRegionSearch />
    </div>
  );
}
