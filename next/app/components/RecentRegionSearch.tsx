import { useEffect, useRef, useState } from "react";
import { useBeach } from "@/app/context/BeachContext";
import { cn } from "@/app/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

interface UserSearch {
  id: string;
  region: {
    id: string;
    name: string;
  };
}

export default function RecentRegionSearch({
  className,
}: {
  className?: string;
}) {
  const { filters, setFilters } = useBeach();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Enhanced caching strategy for recent searches
  const { data: recentSearches } = useQuery({
    queryKey: ["recentSearches"],
    queryFn: async () => {
      const res = await fetch("/api/user-searches?limit=5");
      if (!res.ok) throw new Error("Failed to fetch searches");
      const data = await res.json();
      localStorage.setItem("recentSearches", JSON.stringify(data));
      return data;
    },
    staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache persists for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    initialData: () => {
      // Try to get data from localStorage as initial data
      try {
        const cached = localStorage.getItem("recentSearches");
        return cached ? JSON.parse(cached) : undefined;
      } catch {
        return undefined;
      }
    },
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
  });

  const handleButtonClick = async (search: UserSearch) => {
    if (containerRef.current) {
      setLoadingId(search.id);

      // Check if this region is already in recent searches
      const isExistingRegion = recentSearches?.some(
        (s: UserSearch) => s.region.id === search.region.id
      );

      // Update filters first
      setFilters({
        ...filters,
        location: {
          ...filters.location,
          region: search.region.name,
          regionId: search.region.id,
        },
      });

      // Only track and refetch if it's a new region
      if (!isExistingRegion) {
        await trackSearch(search.region.id);
        await queryClient.invalidateQueries({ queryKey: ["recentSearches"] });
      } else {
        // Subtle bounce animation for existing region
        const button = containerRef.current.querySelector(
          `[data-region-id="${search.region.id}"]`
        );
        if (button) {
          gsap.to(button, {
            y: -4,
            yoyo: true,
            repeat: 1,
            duration: 0.2,
            ease: "power2.inOut",
          });
        }
      }

      setLoadingId(null);
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
      {recentSearches.map((search: UserSearch) => (
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
            loadingId === search.id && "cursor-wait",
            filters.location.regionId === search.region.id &&
              "bg-[var(--color-bg-tertiary)] text-white border-transparent"
          )}
        >
          {loadingId === search.id ? (
            <>
              <LoadingSpinner size="sm" />
              {search.region.name}
            </>
          ) : (
            search.region.name
          )}
        </button>
      ))}
    </div>
  );
}
