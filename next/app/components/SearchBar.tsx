"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { BeachSearchInput } from "@/app/components/ui/BeachSearchInput";
import type { Beach } from "@/app/types/beaches";

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
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);

  // Get search query from URL
  const searchQuery = searchParams.get("searchQuery") || "";

  // Clear selected beach when region changes
  useEffect(() => {
    const regionId = searchParams.get("regionId");
    if (regionId !== filters.regionId) {
      setSelectedBeach(null);
    }
  }, [searchParams, filters.regionId]);

  // Clear selected beach when search query is cleared
  useEffect(() => {
    if (!searchQuery) {
      setSelectedBeach(null);
    }
  }, [searchQuery]);

  const handleBeachSelect = (beach: Beach | null) => {
    setSelectedBeach(beach);
    if (beach) {
      selectBeach(beach);
    } else {
      // Clear search when beach is deselected
      selectBeach(null);
    }
  };

  return (
    <BeachSearchInput
      value={searchQuery}
      selectedBeach={selectedBeach}
      onBeachSelect={handleBeachSelect}
      placeholder={placeholder}
      className={className}
      showSelectedBadge={true}
      minSearchLength={2}
    />
  );
}
