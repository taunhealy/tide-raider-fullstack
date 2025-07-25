"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ad } from "@/app/types/ads";
import { AD_CATEGORIES } from "@/app/lib/advertising/constants";
import { Badge } from "@/app/components/ui/badge";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";

export default function RegionalSidebar() {
  const { filters } = useBeachFilters();

  // Fetch ads using TanStack Query
  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["ads", filters.regionId],
    queryFn: async () => {
      const response = await fetch(`/api/ads?regionId=${filters.regionId}`);
      if (!response.ok) throw new Error("Failed to fetch ads");
      return response.json();
    },
    enabled: !!filters.regionId,
  });

  // Memoize the ads processing to prevent infinite updates
  const processedAds = useMemo(() => {
    if (!filters.regionId) return [];

    // Filter ads based on selected region and category
    const regionAds = ads.filter((ad) => {
      return ad.regionId != null && ad.regionId.toString() === filters.regionId;
    });

    // Group ads by category and select one from each
    return Object.keys(AD_CATEGORIES).reduce(
      (acc, category) => {
        const categoryAds = regionAds.filter((ad) => ad.category === category);
        if (categoryAds.length > 0) {
          const dayTimestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
          const selectedIndex = dayTimestamp % categoryAds.length;
          acc.push(categoryAds[selectedIndex]);
        } else {
          acc.push({
            id: `placeholder-${category}`,
            category,
            isPlaceholder: true,
          });
        }
        return acc;
      },
      [] as (Ad | { id: string; category: string; isPlaceholder: true })[]
    );
  }, [filters.regionId, ads]);

  if (!filters.regionId) return null;

  return (
    <aside className="hidden lg:block w-64 space-y-4 flex-shrink-0">
      {processedAds.map((ad) => {
        const categoryKey = ad.category as keyof typeof AD_CATEGORIES;
        const categoryInfo = AD_CATEGORIES[categoryKey];

        if ("isPlaceholder" in ad) {
          return (
            <a
              key={ad.id}
              href="/advertising"
              className={`block bg-[var(--color-bg-primary)] rounded-lg p-6 text-center hover:bg-gray-50 transition-colors border border-gray-200 ${
                categoryInfo?.id === "clown"
                  ? "border-white-300 border-[1px]"
                  : ""
              }`}
            >
              <Badge variant="secondary" className="mx-auto mb-3">
                {categoryInfo?.emoji} {categoryInfo?.label}
              </Badge>
              <p className="text-sm text-gray-600 mb-2 font-primary">
                {categoryInfo?.label || ad.category} in {filters.regionId}?
              </p>
              <div className="h-px bg-gray-100 my-3 w-2/3 mx-auto"></div>
              <p className="heading-7 text-[var(--color-text-secondary)] font-primary font-medium">
                Sponsor this space
              </p>
            </a>
          );
        }

        return (
          <a
            key={ad.id}
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`block bg-[var(--color-bg-primary)] rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200 ${
              categoryInfo?.id === "clown"
                ? "border-pink-600 border-[1.5px]"
                : ""
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <Badge variant="secondary" className="mb-2">
                {categoryInfo?.emoji} {categoryInfo?.label}
              </Badge>
              <span className="text-xs text-gray-400 font-primary">Ad</span>
            </div>

            <h3 className="heading-7 font-primary font-semibold text-gray-900 mb-1">
              {ad.title || ad.companyName}
            </h3>

            <p className="text-sm font-primary text-gray-500 mb-3">
              {filters.regionId}
            </p>

            <div className="h-px bg-gray-100 my-3"></div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-primary text-gray-400">
                Sponsored
              </span>
              <span className="text-xs font-primary text-[var(--color-text-secondary)] hover:underline">
                Learn more
              </span>
            </div>
          </a>
        );
      })}
    </aside>
  );
}
