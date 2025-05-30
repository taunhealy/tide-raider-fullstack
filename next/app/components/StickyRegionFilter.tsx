"use client";

import { useEffect, useState } from "react";
import { cn } from "@/app/lib/utils";
import { ChevronRight } from "lucide-react";

interface StickyRegionFilterProps {
  regions: string[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  regionCounts: Record<string, number>;
  isLoading?: boolean;
}

export default function StickyRegionFilter({
  regions,
  selectedRegion,
  onRegionChange,
  regionCounts,
  isLoading = false,
}: StickyRegionFilterProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 200;
      setIsVisible(scrollY > threshold);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-[72px] left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 lg:hidden",
        "transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="container mx-auto">
        <div className="relative">
          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => onRegionChange(region)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap",
                  "px-3 py-1.5 rounded-full text-sm font-medium",
                  "transition-colors duration-200",
                  selectedRegion === region
                    ? "bg-[var(--color-bg-tertiary)] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {region}
                {!isLoading && regionCounts[region] > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-white text-[var(--color-bg-tertiary)] rounded-full">
                    {regionCounts[region]}
                  </span>
                )}
                {isLoading && (
                  <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none flex items-center justify-end pr-2">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
