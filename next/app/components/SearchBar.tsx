"use client";

import { Search } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import type { Beach } from "@/app/types/beaches";
import { useId } from "react";
import { useBeachContext } from "@/app/context/BeachContext";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  placeholder = "Search breaks...",
  className,
}: SearchBarProps) {
  const { filters, updateFilters, beaches } = useBeachContext();
  const [mounted, setMounted] = useState(false);
  const [localValue, setLocalValue] = useState(filters.searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();

  // Update local value when filter value changes
  useEffect(() => {
    setLocalValue(filters.searchQuery);
  }, [filters.searchQuery]);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (searchValue: string) => {
    updateFilters({ ...filters, searchQuery: searchValue });
  };

  const debouncedSearch = useRef(debounce(handleSearch, 300)).current;

  // Cleanup debounced function
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setShowSuggestions(true);
    debouncedSearch(newValue);
  };

  const handleBlur = () => {
    // Use RAF to ensure this happens after any click events
    requestAnimationFrame(() => {
      setShowSuggestions(false);
    });
  };

  // Filter suggestions based on input
  const suggestions = beaches
    .filter(
      (beach) =>
        beach.name.toLowerCase().includes(localValue.toLowerCase()) ||
        beach.region?.name.toLowerCase().includes(localValue.toLowerCase())
    )
    .slice(0, 5); // Limit to 5 suggestions

  // Render static markup during SSR and initial hydration
  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className={cn("relative w-full max-w-md font-primary", className)}>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <div className="relative">
            <input
              type="text"
              readOnly
              defaultValue={localValue}
              placeholder={placeholder}
              aria-label="Search"
              className={cn(
                "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg",
                "focus:outline-none focus:ring-1 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent",
                "placeholder-gray-400 transition-all ml-1"
              )}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={cn("relative w-full max-w-md font-primary", className)}>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            id={searchId}
            value={localValue}
            onChange={handleChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            aria-label="Search"
            aria-expanded={showSuggestions}
            aria-controls={
              showSuggestions ? `${searchId}-suggestions` : undefined
            }
            aria-autocomplete="list"
            className={cn(
              "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg",
              "focus:outline-none focus:ring-1 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent",
              "placeholder-gray-400 transition-all ml-1"
            )}
          />
        </div>

        {showSuggestions && localValue && suggestions.length > 0 && (
          <div
            id={`${searchId}-suggestions`}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((beach) => (
              <div
                key={beach.id}
                role="option"
                aria-selected="false"
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
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
    </div>
  );
}
