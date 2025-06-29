import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import type { UserSearch } from "@/app/types/region";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";

interface RecentRegionSearchProps {
  className?: string;
}

export default function RecentRegionSearch({
  className,
}: RecentRegionSearchProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { filters, selectRegion } = useBeachFilters();

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
    setLoadingId(search.id);

    try {
      console.log("Full search object:", search);
      console.log("Region data:", search.region);

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

      console.log("Selecting region with data:", selectedRegion);
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

  // Add debug logging for filters
  useEffect(() => {
    console.log("Current filters:", filters);
  }, [filters]);

  if (!recentSearches?.length) return null;

  return (
    <div ref={containerRef} className={cn("flex flex-wrap gap-2", className)}>
      {recentSearches.map((search: UserSearch) => {
        const isSelected = filters.regionId
          ? filters.regionId.toLowerCase() === search.region.id.toLowerCase()
          : false;
        console.log(`Region ${search.region.name} comparison:`, {
          filterRegionId: filters.regionId,
          searchRegionId: search.region.id,
          isSelected,
        });
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
              "hover:bg-[var(--color-bg-tertiary)] transition-colors",
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
