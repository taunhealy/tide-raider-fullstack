"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scrollarea";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useDebounce } from "@/app/hooks/useDebounce";
import { cn } from "@/app/lib/utils";
import type { Beach } from "@/app/types/beaches";

interface BeachSearchInputProps {
  value?: string;
  selectedBeach?: Beach | null;
  onBeachSelect?: (beach: Beach | null) => void;
  placeholder?: string;
  className?: string;
  showSelectedBadge?: boolean;
  minSearchLength?: number;
}

export function BeachSearchInput({
  value: controlledValue,
  selectedBeach,
  onBeachSelect,
  placeholder = "Search beaches...",
  className,
  showSelectedBadge = true,
  minSearchLength = 2,
}: BeachSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(controlledValue || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const ignoreBlurRef = useRef(false);

  // Update local search term when controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setSearchTerm(controlledValue);
    }
  }, [controlledValue]);

  // Update search term when selected beach changes
  useEffect(() => {
    if (selectedBeach) {
      setSearchTerm(selectedBeach.name);
    } else if (!controlledValue) {
      setSearchTerm("");
    }
  }, [selectedBeach, controlledValue]);

  // Fetch beaches based on debounced search
  const { data: beaches, isLoading } = useQuery({
    queryKey: ["beaches-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < minSearchLength) {
        return [];
      }
      const response = await fetch(
        `/api/beaches/search?term=${encodeURIComponent(debouncedSearch)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch beaches");
      }
      return response.json() as Promise<Beach[]>;
    },
    enabled: debouncedSearch.length >= minSearchLength,
    retry: 0,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Show dropdown when there are search results and input is focused
  useEffect(() => {
    if (
      beaches &&
      beaches.length > 0 &&
      debouncedSearch.length >= minSearchLength &&
      isFocused
    ) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [beaches, debouncedSearch, isFocused, minSearchLength]);

  const handleBeachSelect = (beach: Beach) => {
    ignoreBlurRef.current = true;
    setSearchTerm(beach.name);
    setShowDropdown(false);
    onBeachSelect?.(beach);
  };

  const handleClear = () => {
    setSearchTerm("");
    setShowDropdown(false);
    onBeachSelect?.(null);
  };

  const handleBlur = () => {
    if (!ignoreBlurRef.current) {
      setTimeout(() => {
        setShowDropdown(false);
        setIsFocused(false);
      }, 200);
    }
    ignoreBlurRef.current = false;
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (
      beaches &&
      beaches.length > 0 &&
      debouncedSearch.length >= minSearchLength
    ) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={cn("space-y-2", className)} ref={searchRef}>
      {/* Selected Beach Badge */}
      {showSelectedBadge && selectedBeach && (
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-sm font-medium text-amber-900">
            <span>{selectedBeach.name}</span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 hover:bg-amber-100 rounded-full p-0.5 transition-colors"
              aria-label="Remove beach"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative overflow-visible">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value.length >= minSearchLength) {
              setShowDropdown(true);
            } else {
              setShowDropdown(false);
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg",
            "focus-visible:ring-0 focus-visible:bg-gray-50 focus-visible:border-gray-300",
            "placeholder-gray-400 transition-all font-primary",
            "focus-visible:ring-offset-0"
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        )}

        {/* Dropdown with Results */}
        {showDropdown && beaches && beaches.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
            <ScrollArea className="max-h-[200px]">
              {beaches.map((beach) => (
                <button
                  key={beach.id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  onClick={() => handleBeachSelect(beach)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur from firing too soon
                    handleBeachSelect(beach);
                  }}
                >
                  <div className="font-medium font-primary">{beach.name}</div>
                  <div className="text-sm text-gray-500 font-primary">
                    {beach.region?.name}, {beach.countryId}
                  </div>
                </button>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
