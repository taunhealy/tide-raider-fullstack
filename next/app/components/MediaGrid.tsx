"use client";

import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { Beach } from "@/app/types/beaches";
import { useSession } from "next-auth/react";
import { Ad, Service } from "@/app/types/ads";
import { useQuery } from "@tanstack/react-query";
import {
  AD_CATEGORIES,
  ADVENTURE_AD_CATEGORIES,
} from "@/app/lib/advertising/constants";
import dynamic from "next/dynamic";
import { useEffect } from "react";

interface MediaGridProps {
  videos?: { url: string; title: string; platform: "youtube" | "vimeo" }[];
  beach: Beach;
}

function MediaGridBase({ videos = [], beach }: MediaGridProps) {
  console.log("MediaGrid received beach:", {
    id: beach.id,
    name: beach.name,
    region: beach.region,
  });

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ["ads", beach.id, beach.region],
    queryFn: async () => {
      // Normalize the region ID to match the format in the database
      const normalizedRegion = beach.region
        ? beach.region.toLowerCase().replace(/ /g, "-")
        : "";

      console.log(
        "Fetching ads for beach:",
        beach.id,
        "normalized region:",
        normalizedRegion
      );

      const response = await fetch(
        `/api/advertising/ads?beachId=${beach.id}&regionId=${normalizedRegion}`
      );

      if (!response.ok) throw new Error("Failed to fetch ads");
      const data = await response.json();
      console.log("Received ads data:", data);
      return Array.isArray(data.ads) ? data.ads : [];
    },
  });

  // Log the ads that were received
  useEffect(() => {
    console.log("Ads loaded in MediaGrid:", ads);
    console.log("Beach ID:", beach.id);
    console.log("Beach region:", beach.region);
    console.log("Is this Muizenberg?", beach.id === "muizenberg-beach");
  }, [ads, beach.id, beach.region]);

  // Separate local and adventure ads
  const localAds = ads.filter(
    (ad) => ad.categoryType === "local" || !ad.categoryType
  );
  const adventureAds = ads.filter((ad) => ad.categoryType === "adventure");

  console.log("Local ads:", localAds);
  console.log("Adventure ads:", adventureAds);

  // Prepare local services (coffee shops, shapers, etc.)
  const regularServices = [
    ...(beach.coffeeShop || []).map((shop) => ({
      type: "coffee_shop",
      name: shop.name,
      category: "Coffee Shop",
      url: undefined,
      isAd: false,
    })),
    ...(beach.shaper || []).map((shaper) => ({
      type: "shaper",
      name: shaper.name,
      category: "Shaper",
      url: shaper.url,
      isAd: false,
    })),
    ...(beach.beer || []).map((beer) => ({
      type: "beer",
      name: beer.name,
      category: "Beer",
      url: beer.url,
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

  if (!videos.length && !services.length && !adventureServices.length)
    return null;

  return (
    <div className="space-y-6">
      {/* Videos Grid */}
      {videos.length > 0 && (
        <div className="border border-[var(--color-border-light)] rounded-lg p-5">
          <h2 className="text-base font-medium font-primary text-[var(--color-text-primary)] mb-4">
            Videos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {videos.map((video, index) => (
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
                    <svg
                      className="w-5 h-5 text-white ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <h3 className="text-white text-sm font-medium font-primary line-clamp-2 drop-shadow-lg">
                    {video.title || "Watch video"}
                  </h3>
                </div>
              </a>
            ))}
          </div>
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
                        : `https://www.google.com/maps/search/${encodeURIComponent(service.name + " " + beach.region)}`
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
                    {beach.region}
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
                    {beach.region}
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

// Export a client-only version of the component
export const MediaGrid = dynamic(() => Promise.resolve(MediaGridBase), {
  ssr: false,
});
