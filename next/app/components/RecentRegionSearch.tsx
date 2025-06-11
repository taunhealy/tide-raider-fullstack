import { useEffect, useState } from "react";
import { useBeach } from "@/app/context/BeachContext";
import { cn } from "@/app/lib/utils";

const MAX_RECENT_REGIONS = 5;

interface RecentRegionSearchProps {
  className?: string;
}

export default function RecentRegionSearch({
  className,
}: RecentRegionSearchProps) {
  const { filters, setFilters } = useBeach();
  const [recentRegions, setRecentRegions] = useState<
    Array<{ name: string; id: string }>
  >([]);

  // Load recent regions from localStorage on mount
  useEffect(() => {
    const savedRegions = localStorage.getItem("recentRegions");
    if (savedRegions) {
      setRecentRegions(JSON.parse(savedRegions));
    }
  }, []);

  // Update recent regions when filter changes
  useEffect(() => {
    if (filters.location.region && filters.location.regionId) {
      setRecentRegions((prev) => {
        // Remove if already exists
        const filtered = prev.filter((r) => r.id !== filters.location.regionId);
        // Add to front of array
        const updated = [
          { name: filters.location.region, id: filters.location.regionId },
          ...filtered,
        ].slice(0, MAX_RECENT_REGIONS); // Keep only the most recent 5

        // Save to localStorage
        localStorage.setItem("recentRegions", JSON.stringify(updated));

        return updated;
      });
    }
  }, [filters.location.region, filters.location.regionId]);

  const handleRegionClick = (regionName: string, regionId: string) => {
    setFilters({
      ...filters,
      location: {
        ...filters.location,
        region: regionName,
        regionId: regionId,
      },
    });
  };

  if (recentRegions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {recentRegions.map((region) => (
        <button
          key={region.id}
          onClick={() => handleRegionClick(region.name, region.id)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full",
            "bg-white border border-gray-200",
            "hover:bg-gray-50 transition-colors",
            "font-primary text-[var(--color-text-primary)]",
            filters.location.regionId === region.id &&
              "bg-[var(--color-bg-tertiary)] text-white border-transparent"
          )}
        >
          {region.name}
        </button>
      ))}
    </div>
  );
}
