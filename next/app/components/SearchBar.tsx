"use client";

import { Search } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useEffect, useRef, useState, useMemo } from "react";
import debounce from "lodash/debounce";
import type { Beach } from "@/app/types/beaches";
import { useId } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useSearchParams } from "next/navigation";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  placeholder = "Search breaks...",
  className,
}: SearchBarProps) {
  const searchParams = useSearchParams();
  const { filters, selectBeach } = useBeachFilters();
  const [mounted, setMounted] = useState(false);
  const [localValue, setLocalValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<Beach[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ignoreBlurRef = useRef(false);
  const searchId = useId();

  // Update local value when URL search query changes
  useEffect(() => {
    const urlSearchQuery = searchParams.get("searchQuery") || "";
    setLocalValue(urlSearchQuery);
  }, [searchParams]);

  // Clear search when region changes
  useEffect(() => {
    const regionId = searchParams.get("regionId");
    if (regionId !== filters.regionId) {
      setLocalValue("");
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [searchParams, filters.regionId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBlur = () => {
    if (!ignoreBlurRef.current) {
      setTimeout(() => setShowSuggestions(false), 200);
    }
    ignoreBlurRef.current = false;
  };

  const handleSelectBeach = (beach: Beach) => {
    ignoreBlurRef.current = true;
    setLocalValue(beach.name);
    setShowSuggestions(false);
    selectBeach(beach);
  };

  const handleChange = useMemo(
    () =>
      debounce(async (value: string) => {
        setLocalValue(value);

        if (!value || value.length < 3) {
          setSearchResults([]);
          setShowSuggestions(false);
          return;
        }

        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/beaches/search?term=${encodeURIComponent(value)}`
          );
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      handleChange.cancel();
    };
  }, [handleChange]);

  const suggestions = searchResults.slice(0, 5);

  if (!mounted) {
    return (
      <div className="">
        <div className={cn("relative w-full max-w-md font-primary", className)}>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <div className="relative">
            <input
              type="text"
              readOnly
              value="" // Always provide a value, never undefined
              placeholder="Search Surf Breaks"
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
            onChange={(e) => {
              setLocalValue(e.target.value);
              handleChange(e.target.value);
            }}
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
                onClick={() => {
                  handleSelectBeach(beach);
                }}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur from firing too soon
                  handleSelectBeach(beach);
                }}
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
