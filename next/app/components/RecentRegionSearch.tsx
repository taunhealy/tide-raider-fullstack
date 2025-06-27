import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import gsap from "gsap";
import type { Region, UserSearch } from "@/app/types/region";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";

interface RecentRegionSearchProps {
  selectedRegionId?: string;
  className?: string;
}

export default function RecentRegionSearch({
  selectedRegionId,
  className,
}: RecentRegionSearchProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { updateFilter } = useBeachFilters();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

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
      const selectedRegion: Region = {
        id: search.region.id,
        name: search.region.name,
        countryId: search.region.country?.id || "",
        continent: search.region.continent,
        country: search.region.country,
      };

      // Use updateFilter instead of directly manipulating URL
      updateFilter("regionId", selectedRegion.id.toLowerCase());
      updateFilter("region", selectedRegion.name);
      updateFilter("country", selectedRegion.country?.name || "");
      updateFilter("continent", selectedRegion.continent || "");

      trackSearch(search.region.id);
    } catch (error) {
      console.error("Error during region selection:", error);
    } finally {
      setTimeout(() => {
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
