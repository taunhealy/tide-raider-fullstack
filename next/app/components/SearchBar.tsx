"use client";

import { Search } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import type { Beach } from "@/app/types/beaches";
import { useId } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  beaches: Beach[];
}

export default function SearchBar({
  placeholder = "Search breaks...",
  className,
  beaches,
}: SearchBarProps) {
  const { filters, updateFilter } = useBeachFilters();
  const [mounted, setMounted] = useState(false);
  const [localValue, setLocalValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const [searchResults, setSearchResults] = useState<Beach[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize localValue after component mounts
  useEffect(() => {
    if (mounted && filters.searchQuery) {
      setLocalValue(filters.searchQuery);
    }
  }, [mounted, filters.searchQuery]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (searchValue: string) => {
    updateFilter("searchQuery", searchValue);
  };

  const debouncedSearch = useRef(debounce(handleSearch, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear the search query parameter if input is empty
    if (!newValue) {
      updateFilter("searchQuery", "");
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    if (newValue.length >= 2) {
      setIsSearching(true);
      try {
        // Get current regionId from URL
        const currentRegionId = new URLSearchParams(window.location.search).get(
          "regionId"
        );

        const response = await fetch(
          `/api/beaches/search?term=${encodeURIComponent(newValue)}${
            currentRegionId ? `&regionId=${currentRegionId}` : ""
          }`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
      setShowSuggestions(true);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      setShowSuggestions(false);
    });
  };

  const handleSelectBeach = (beach: Beach) => {
    setLocalValue(beach.name);
    updateFilter("searchQuery", beach.name);
    setShowSuggestions(false);
  };

  const suggestions = searchResults.slice(0, 5);

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
              value="" // Always provide a value, never undefined
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
                onMouseDown={() => handleSelectBeach(beach)}
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
