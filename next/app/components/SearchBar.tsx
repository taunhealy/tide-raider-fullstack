"use client";

import { Search } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import type { Beach } from "@/app/types/beaches";

interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
  onBeachSelect?: (beach: Beach) => void;
  suggestions?: Beach[];
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onSearch,
  onBeachSelect,
  suggestions = [],
  placeholder = "Search breaks...",
  className,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedSearch = useRef(
    debounce((searchValue: string) => {
      onSearch(searchValue);
    }, 300)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

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
            debouncedSearch(newValue);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg",
            "focus:outline-none focus:ring-1 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent",
            "placeholder-gray-400 transition-all ml-1"
          )}
        />

        {showSuggestions &&
          localValue &&
          suggestions.length > 0 &&
          onBeachSelect && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((beach) => (
                <div
                  key={beach.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    onBeachSelect(beach);
                    setShowSuggestions(false);
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
