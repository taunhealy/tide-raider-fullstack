"use client";

import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { Ad, Service } from "@/app/types/ads";
import { useQuery } from "@tanstack/react-query";
import {
  AD_CATEGORIES,
  ADVENTURE_AD_CATEGORIES,
} from "@/app/lib/advertising/constants";
import dynamic from "next/dynamic";
import { LogEntry } from "@/app/types/raidlogs";
import SurfForecastWidget from "./SurfForecastWidget";
import Link from "next/link";
import { LogEntrySkeleton } from "@/app/components/LogEntrySkeleton";
import { Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";

interface MediaGridProps {
  videos?:
    | {
        url: string;
        title: string;
        platform: "youtube" | "vimeo";
      }[]
    | null;
  beach: {
    id: string;
    name: string;
    region?: {
      id: string;
      name: string;
      country?: { name: string };
    };
    // Simplified service relationships
    coffeeShops?: { name: string }[];
    shapers?: { name: string; url?: string }[];
    beerSpots?: { name: string; url?: string }[];
  };
  logEntry?: {
    imageUrl?: string | null;
    videoUrl?: string | null;
    videoPlatform?: "youtube" | "vimeo" | null;
  };
}

function MediaGridBase({ videos = [], beach, logEntry }: MediaGridProps) {
  // Fetch latest log entry for this beach
  const { data: latestLogEntry, isLoading: isLoadingLog } = useQuery<
    LogEntry[]
  >({
    queryKey: ["raid-logs", beach.name],
    queryFn: async () => {
      const response = await fetch(
        `/api/raid-logs?beaches=${encodeURIComponent(beach.name)}&limit=1`
      );
      if (!response.ok) throw new Error("Failed to fetch log entry");
      const data = await response.json();
      return data;
    },
  });

  // Ensure videos is always an array and has the correct shape
  const beachVideos = Array.isArray(videos)
    ? videos.filter(
        (video) =>
          video &&
          typeof video.url === "string" &&
          typeof video.title === "string" &&
          (video.platform === "youtube" || video.platform === "vimeo")
      )
    : [];

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["ads", beach.id, beach.region],
    queryFn: async () => {
      const response = await fetch(
        `/api/advertising/ads?beachId=${beach.id}&regionId=${beach.region?.id}`
      );

      if (!response.ok) throw new Error("Failed to fetch ads");
      const data = await response.json();
      return Array.isArray(data.ads) ? data.ads : [];
    },
  });

  // Separate local and adventure ads
  const localAds = ads.filter(
    (ad) => ad.categoryType === "local" || !ad.categoryType
  );
  const adventureAds = ads.filter((ad) => ad.categoryType === "adventure");

  // Prepare local services (coffee shops, shapers, etc.)
  const regularServices = [
    ...(beach.coffeeShops || []).map((shop) => ({
      type: "coffee_shop",
      name: shop.name,
      category: "Coffee Shop",
      url: undefined,
      isAd: false,
    })),
    ...(beach.shapers || []).map((shaper) => ({
      type: "shaper",
      name: shaper.name,
      category: "Shaper",
      url: shaper.url,
      isAd: false,
    })),
    ...(beach.beerSpots || []).map((spot) => ({
      type: "beer",
      name: spot.name,
      category: "Beer",
      url: spot.url,
      isAd: false,
    })),
  ];

  // Convert local ads to service format
  const localAdServices = localAds.map((ad) => ({
    type: ad.category,
    name: ad.title || ad.companyName,
    category:
      AD_CATEGORIES[ad.category as keyof typeof AD_CATEGORIES]?.label ||
      ad.customCategory ||
      ad.category,
    url: ad.linkUrl,
    isAd: true,
    adId: ad.id,
  }));

  // Convert adventure ads to service format
  const adventureAdServices = adventureAds.map((ad) => ({
    type: ad.category,
    name: ad.title || ad.companyName,
    category:
      ADVENTURE_AD_CATEGORIES[
        ad.category as keyof typeof ADVENTURE_AD_CATEGORIES
      ]?.label ||
      ad.category ||
      ad.category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    url: ad.linkUrl,
    isAd: true,
    adId: ad.id,
  }));

  // Combine all services
  const services = [...regularServices, ...localAdServices];

  // For adventure experiences
  const adventureServices = [...adventureAdServices];

  return (
    <div className="space-y-6">
      {/* Latest Log Entry Section */}
      {isLoadingLog ? (
        <LogEntrySkeleton />
      ) : (
        latestLogEntry &&
        latestLogEntry.length > 0 && (
          <div className="border border-[var(--color-border-light)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-medium font-primary text-[var(--color-text-primary)]">
                Latest Surf Log
              </h2>
              <span className="text-sm font-primary text-[var(--color-text-secondary)]">
                {new Date(latestLogEntry[0].date).toLocaleDateString()}
              </span>
            </div>

            <Link
              href={`/raidlogs/${latestLogEntry[0].id}`}
              className="block group"
            >
              <div className="bg-[var(--color-bg-primary)] rounded-lg p-2 border border-[var(--color-border-light)] space-y-2 transition-all duration-200 hover:border-[var(--color-border-medium)] hover:shadow-sm">
                {/* Rating and Surfer Info with Media Icons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {latestLogEntry[0].surferName &&
                      !latestLogEntry[0].isAnonymous && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-primary text-[var(--color-text-secondary)]">
                            {latestLogEntry[0].surferName}
                          </span>
                          {/* Add video/image icons if media exists */}
                          <div className="flex items-center gap-1">
                            {latestLogEntry[0].videoUrl && (
                              <VideoIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                            )}
                            {latestLogEntry[0].imageUrl && (
                              <ImageIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                            )}
                          </div>
                        </div>
                      )}
                    <div className="flex flex-col justify-between border-l border-[var(--color-border-light)] pl-2">
                      <div className="flex">
                        {[...Array(latestLogEntry[0].surferRating)].map(
                          (_, i) => (
                            <span key={i} className="text-yellow-400">
                              ★
                            </span>
                          )
                        )}
                        {[...Array(5 - latestLogEntry[0].surferRating)].map(
                          (_, i) => (
                            <span key={i} className="text-gray-200">
                              ★
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Forecast conditions */}
                  {latestLogEntry[0].forecast && (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto border-t sm:border-t-0 border-[var(--color-border-light)] py-1.5">
                      <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 rounded-full text-xs font-primary">
                        <span className="hidden sm:inline mr-1">
                          {getWindEmoji(latestLogEntry[0].forecast.windSpeed)}
                        </span>
                        <span>
                          {latestLogEntry[0].forecast.windSpeed}kts{" "}
                          {degreesToCardinal(
                            latestLogEntry[0].forecast.windDirection
                          )}
                        </span>
                      </div>
                      <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 rounded-full text-xs font-primary">
                        <span className="hidden sm:inline mr-1">
                          {getSwellEmoji(
                            latestLogEntry[0].forecast.swellHeight
                          )}
                        </span>
                        <span>
                          {latestLogEntry[0].forecast.swellHeight}m @{" "}
                          {latestLogEntry[0].forecast.swellPeriod}s{" "}
                          {degreesToCardinal(
                            latestLogEntry[0].forecast.swellDirection
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments */}
                {latestLogEntry[0].comments && (
                  <div className="border-t border-[var(--color-border-light)] pt-2 mt-2">
                    <p className="text-sm font-primary text-[var(--color-text-primary)] leading-relaxed">
                      {latestLogEntry[0].comments}
                    </p>
                  </div>
                )}

                {/* Image */}
                {latestLogEntry[0].imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-[var(--color-border-light)]">
                    <img
                      src={latestLogEntry[0].imageUrl}
                      alt="Surf session"
                      className="object-cover w-full h-full transition-transform group-hover:scale-105 duration-300"
                    />
                  </div>
                )}

                {/* View Details Link */}
                <div className="flex items-center justify-end pt-2 text-sm font-primary text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1 group-hover:text-[var(--color-tertiary)]">
                    View details
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )
      )}

      {/* Beach Videos Section - Add debug info */}
      {beachVideos.length > 0 ? (
        <div className="border border-[var(--color-border-light)] rounded-lg p-5">
          <h2 className="text-base font-medium font-primary text-[var(--color-text-primary)] mb-4">
            Videos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {beachVideos.map((video, index) => (
              <a
                key={`video-${index}`}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-video rounded-lg overflow-hidden group border border-[var(--color-border-light)] hover:border-[var(--color-border-medium)] transition-all duration-200"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getVideoThumbnail(video.url, video.platform)})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-75" />
                <div className="absolute inset-0 flex items-center justify-center opacity-90 scale-95 group-hover:scale-100">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-tertiary)] flex items-center justify-center shadow-lg">
                    <VideoIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <h3 className="text-white text-sm font-medium font-primary line-clamp-2 drop-shadow-lg">
                    {video.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "none" }}>
          No videos available: {JSON.stringify({ videos, beachVideos })}
        </div>
      )}

      {/* Local Services Grid */}
      {services.length > 0 && (
        <div className="border border-[var(--color-border-light)] rounded-lg p-5">
          <h2 className="text-base font-medium font-primary text-[var(--color-text-primary)] mb-4">
            Local Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {services.map((service, index) => {
              // Get emoji based on service type
              let emoji = "🏄‍♂️";
              if (service.type === "coffee_shop") emoji = "☕";
              if (service.type === "shaper") emoji = "🛠️";
              if (service.type === "beer") emoji = "🍺";

              return (
                <a
                  key={`service-${index}`}
                  href={
                    service.url
                      ? service.url
                      : service.isAd
                        ? "/advertising"
                        : `https://www.google.com/maps/search/${encodeURIComponent(service.name + " " + beach.region?.name)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    block 
                    bg-[var(--color-bg-primary)] 
                    rounded-lg 
                    p-6 
                    hover:bg-gray-50 
                    transition-colors 
                    ${
                      service.isAd
                        ? "border border-[var(--color-border-light)] hover:border-[var(--color-border-medium)]"
                        : "border border-gray-200"
                    }
                  `}
                  onClick={(e) => {
                    // Stop propagation to prevent opening the BeachDetailsModal
                    e.stopPropagation();

                    if (service.isAd && (service as any).adId) {
                      fetch("/api/advertising/track", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: "click",
                          adId: (service as any).adId,
                          beachId: beach.id,
                        }),
                      }).catch(console.error);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5">
                      <span>{emoji}</span>
                      <span className="text-sm font-primary font-medium text-gray-600">
                        {service.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="heading-7 font-primary font-semibold text-gray-900 mb-1">
                    {service.name}
                  </h3>

                  <p className="text-sm font-primary text-gray-500 mb-3">
                    {beach.region?.name}
                  </p>

                  <div className="h-px bg-gray-100 my-3"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-primary text-[var(--color-text-secondary)] hover:underline">
                      View details
                    </span>

                    {service.isAd && (
                      <span className="text-xs font-primary text-gray-400">
                        Ad
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Adventure Services Grid */}
      {adventureServices.length > 0 && (
        <div className="border border-[var(--color-border-light)] rounded-lg p-5">
          <h2 className="text-base font-medium font-primary text-[var(--color-text-primary)] mb-4">
            Adventure Experiences
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {adventureServices.map((ad) => {
              // Get emoji based on service type
              let emoji = "🏄‍♂️";

              // Match category IDs from ADVENTURE_AD_CATEGORIES
              if (ad.category.toLowerCase() === "kayaking") emoji = "🚣";
              if (ad.category.toLowerCase() === "diving") emoji = "🤿";
              if (ad.category.toLowerCase() === "paragliding") emoji = "🪂";
              if (ad.category.toLowerCase() === "van-life") emoji = "🚐";

              // Try to get emoji from ADVENTURE_AD_CATEGORIES if available
              const categoryConfig =
                ADVENTURE_AD_CATEGORIES[
                  ad.category.toLowerCase() as keyof typeof ADVENTURE_AD_CATEGORIES
                ];
              if (categoryConfig?.emoji) {
                emoji = categoryConfig.emoji;
              }

              // Get normalized category name
              const categoryName =
                ADVENTURE_AD_CATEGORIES[
                  ad.category.toLowerCase() as keyof typeof ADVENTURE_AD_CATEGORIES
                ]?.label ||
                ad.category ||
                (ad.category as string)
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");

              return (
                <a
                  key={ad.adId}
                  href={ad.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[var(--color-bg-primary)] rounded-lg p-6 hover:bg-gray-50 transition-colors border border-[var(--color-border-light)] hover:border-[var(--color-border-medium)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetch("/api/advertising/track", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: "click",
                        adId: ad.adId,
                        beachId: beach.id,
                      }),
                    }).catch(console.error);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5">
                      <span>{emoji}</span>
                      <span className="text-sm font-primary font-medium text-gray-600">
                        {categoryName}
                      </span>
                    </div>
                  </div>

                  <h3 className="heading-7 font-primary font-semibold text-gray-900 mb-1">
                    {ad.name}
                  </h3>

                  <p className="text-sm font-primary text-gray-500 mb-3">
                    {beach.region?.name}
                  </p>

                  <div className="h-px bg-gray-100 my-3"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-primary text-[var(--color-text-secondary)] hover:underline">
                      View details
                    </span>
                    <span className="text-xs font-primary text-gray-400">
                      Sponsored
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Add this skeleton component for the entire MediaGrid
function MediaGridSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Log Entry Skeleton */}
      <div className="border border-[var(--color-border-light)] rounded-lg p-5">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="bg-[var(--color-bg-primary)] rounded-lg p-4 space-y-4">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Videos Skeleton */}
      <div className="border border-[var(--color-border-light)] rounded-lg p-5">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-video bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Instead, export MediaGridBase directly
export const MediaGrid = MediaGridBase;
