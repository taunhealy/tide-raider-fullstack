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
  inputClassName?: string;
  showSelectedBadge?: boolean;
  minSearchLength?: number;
  regionId?: string | null;
}

export function BeachSearchInput({
  value: controlledValue,
  selectedBeach,
  onBeachSelect,
  placeholder = "Search beaches...",
  className,
  inputClassName,
  showSelectedBadge = true,
  minSearchLength = 2,
  regionId,
}: BeachSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(controlledValue || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const ignoreBlurRef = useRef(false);
  const justSelectedRef = useRef(false);

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
    queryKey: ["beaches-search", debouncedSearch, regionId],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < minSearchLength) {
        return [];
      }
      const url = new URL("/api/beaches/search", window.location.origin);
      url.searchParams.set("term", debouncedSearch);
      if (regionId) {
        url.searchParams.set("regionId", regionId);
      }

      const response = await fetch(url.toString());
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
    const hasBeaches = Array.isArray(beaches) && beaches.length > 0;
    const hasMinLength = debouncedSearch && debouncedSearch.length >= minSearchLength;
    
    if (
      hasBeaches &&
      hasMinLength &&
      isFocused &&
      !justSelectedRef.current &&
      searchTerm !== selectedBeach?.name
    ) {
      setShowDropdown(true);
    } else if (!isFocused || !hasMinLength || searchTerm === selectedBeach?.name) {
      setShowDropdown(false);
    }
    
    // Reset the flag after the effect has run
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
    }
  }, [beaches, debouncedSearch, isFocused, minSearchLength, searchTerm, selectedBeach]);

  const handleBeachSelect = (beach: Beach) => {
    if (!beach) return;
    justSelectedRef.current = true;
    ignoreBlurRef.current = true;
    setSearchTerm(beach.name || "");
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
    const hasBeaches = Array.isArray(beaches) && beaches.length > 0;
    const hasMinLength = debouncedSearch && debouncedSearch.length >= minSearchLength;

    if (hasBeaches && hasMinLength) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={cn("space-y-2", className)} ref={searchRef}>
      {/* Selected Beach Badge */}
      {showSelectedBadge && selectedBeach && (
        <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fdf6e9] border border-gray-100 rounded-full text-[12px] font-bold regular tracking-normal text-[#855e32] shadow-sm">
            <span className="opacity-40">Target:</span>
            <span>{selectedBeach.name}</span>
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 hover:bg-[#855e32]/10 rounded-full p-1 transition-all group"
              aria-label="Remove beach"
            >
              <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative overflow-visible">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={searchTerm}
          suppressHydrationWarning
          onChange={(e) => {
            const val = e.target.value;
            setSearchTerm(val);
            if (val && val.length >= minSearchLength) {
              setShowDropdown(true);
            } else {
              setShowDropdown(false);
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "flex h-11 w-full rounded-lg border border-gray-200 bg-white px-10 py-2 text-sm ring-offset-background font-primary",
            "placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-gray-50 focus-visible:border-gray-300",
            "transition-all duration-200",
            inputClassName
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-3.5">
             <div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
          </div>
        )}

        {/* Dropdown with Results */}
        {showDropdown && Array.isArray(beaches) && beaches.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
            <ScrollArea className="max-h-[200px]">
              {beaches.filter(Boolean).map((beach) => (
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
                    {[beach.location, beach.region?.name, beach.countryId]
                      .filter(Boolean)
                      .join(", ")}
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

