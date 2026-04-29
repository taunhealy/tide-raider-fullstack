import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import type { UserSearch } from "@/app/types/regions";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import RegionFilterButton from "./ui/RegionFilterButton";

interface RecentRegionSearchProps {
  className?: string;
  regionCounts?: Record<string, number>;
}

export default function RecentRegionSearch({
  className,
  regionCounts,
}: RecentRegionSearchProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { filters, selectRegion } = useBeachFilters();
  const isInitialLoadRef = useRef(true);

  // Enhanced caching strategy for recent searches
  const {
    data: recentSearches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recentSearches"],
    queryFn: async () => {
      const res = await fetch("/api/user-searches?limit=5");
      if (!res.ok) {
        console.error(
          "[RecentRegionSearch] Failed to fetch searches:",
          res.status,
          res.statusText
        );
        // Return empty array instead of throwing to prevent component from breaking
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Only retry once
  });

  // Track new searches

  const { mutate: trackSearch } = useMutation({
    mutationFn: async (regionId: string) => {
      const res = await fetch("/api/user-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId }),
      });
      if (!res.ok) throw new Error("Failed to track search");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentSearches"] });
    },
  });

  const handleButtonClick = async (search: UserSearch) => {
    if (!containerRef.current) return;
    setLoadingId(search.id);

    try {
      // Make sure we have all the required fields
      const selectedRegion = {
        id: search.region.id,
        regionId: search.region.id,
        name: search.region.name,
        countryId: search.region.country?.id || "",
        country: search.region.country
          ? {
              id: search.region.country.id || "",
              name: search.region.country.name || "",
              continentId: search.region.country.continentId || "",
            }
          : undefined,
        continent: search.region.continent || "",
      };

      await selectRegion(selectedRegion);
      await trackSearch(search.region.id.toLowerCase());
    } finally {
      setTimeout(() => setLoadingId(null), 500);
    }
  };

  // Initial fade in animation
  useEffect(() => {
    if (containerRef.current && recentSearches?.length) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [recentSearches]);


  // Initial region selection effect
  useEffect(() => {
    if (recentSearches?.length && isInitialLoadRef.current) {
      const mostRecentSearch = recentSearches[0];
      const selectedRegion = {
        id: mostRecentSearch.region.id,
        regionId: mostRecentSearch.region.id,
        name: mostRecentSearch.region.name,
        countryId: mostRecentSearch.region.country?.id || "",
        country: mostRecentSearch.region.country
          ? {
              id: mostRecentSearch.region.country.id || "",
              name: mostRecentSearch.region.country.name || "",
              continentId: mostRecentSearch.region.country.continentId || "",
            }
          : undefined,
        continent: mostRecentSearch.region.continent || "",
      };

      selectRegion(selectedRegion);
      trackSearch(mostRecentSearch.region.id.toLowerCase());
      isInitialLoadRef.current = false;
    }
  }, [recentSearches]); // Only depend on recentSearches

  // Show component even if empty - don't hide it completely
  // Only hide if there's an error or still loading initially
  if (isLoading && !recentSearches) {
    return null; // Don't show anything while loading initially
  }

  // If there are no searches, show a message or return null
  // For now, we'll return null to keep the UI clean
  if (!recentSearches?.length) {
    return null;
  }

  return (
    <div ref={containerRef} className={cn("flex flex-wrap gap-2", className)}>
      {recentSearches.filter(Boolean).map((search: UserSearch) => {
        const isSelected = filters.regionId
          ? filters.regionId.toLowerCase() === search.region.id.toLowerCase()
          : false;
        const isLoading = loadingId === search.id;
        const count = regionCounts?.[search.region.id] || 0;

        return (
          <RegionFilterButton
            key={search.id}
            region={{
              id: search.region.id,
              regionId: search.region.id,
              name: search.region.name,
              countryId: search.region.country?.id || "",
              country: search.region.country,
              continent: search.region.continent || "",
            }}
            isSelected={isSelected}
            isLoading={isLoading}
            onClick={() => handleButtonClick(search)}
            count={count}
          />
        );
      })}
    </div>
  );
}
