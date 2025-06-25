import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import type { Region, UserSearch } from "@/app/types/regions";
import { useBeachContext } from "@/app/context/BeachContext";

interface RecentRegionSearchProps {
  selectedRegionId?: string;
  onRegionSelect: (region: Region) => void;
  className?: string;
}

export default function RecentRegionSearch({
  selectedRegionId,
  onRegionSelect,
  className,
}: RecentRegionSearchProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { updateFilters, filters, setLoadingState } = useBeachContext();

  // Enhanced caching strategy for recent searches
  const { data: recentSearches } = useQuery({
    queryKey: ["recentSearches"],
    queryFn: async () => {
      const res = await fetch("/api/user-searches?limit=5");
      if (!res.ok) throw new Error("Failed to fetch searches");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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

    // Set loading states
    setLoadingState("forecast", true);
    setLoadingState("beaches", true);
    setLoadingId(search.id);

    try {
      // Create region object
      const selectedRegion = {
        id: search.region.id,
        name: search.region.name,
        country: search.region.country,
        continent: search.region.continent,
      };

      // Update context
      updateFilters({
        ...filters,
        location: {
          ...filters.location,
          regionId: selectedRegion.id.toLowerCase(),
          region: selectedRegion.name,
          country: selectedRegion.country,
          continent: selectedRegion.continent,
        },
      });

      // Notify parent
      onRegionSelect(selectedRegion);

      // Fetch forecast data first
      const forecastRes = await fetch(
        `/api/surf-conditions?regionId=${selectedRegion.id.toLowerCase()}`
      );

      if (!forecastRes.ok) {
        throw new Error("Failed to fetch forecast data");
      }

      // Track search in background without waiting
      trackSearch(search.region.id);
    } catch (error) {
      console.error("Error during region selection:", error);
    } finally {
      // Small delay before resetting loading states to ensure UI updates
      setTimeout(() => {
        setLoadingState("forecast", false);
        setLoadingState("beaches", false);
        setLoadingId(null);
      }, 500);
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

  if (!recentSearches?.length) return null;

  return (
    <div ref={containerRef} className={cn("flex flex-wrap gap-2", className)}>
      {recentSearches.map((search: UserSearch) => {
        const isSelected =
          selectedRegionId?.toLowerCase() === search.region.id.toLowerCase();
        const isLoading = loadingId === search.id;

        return (
          <button
            key={search.id}
            data-region-id={search.region.id}
            onClick={() => handleButtonClick(search)}
            disabled={loadingId !== null}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full",
              "bg-white border border-gray-200",
              "hover:bg-gray-50 transition-colors",
              "font-primary text-[var(--color-text-primary)]",
              "flex items-center gap-2",
              isLoading && "cursor-wait opacity-70",
              isSelected &&
                "bg-[var(--color-bg-tertiary)] text-white border-transparent"
            )}
          >
            {search.region.name}
          </button>
        );
      })}
    </div>
  );
}
