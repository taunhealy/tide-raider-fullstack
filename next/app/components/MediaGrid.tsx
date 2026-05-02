"use client";

import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { Play, ArrowUpRight } from "lucide-react";
import Image from "next/image";

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
    logEntries?: any[]; 
    // Simplified service relationships
    coffeeShops?: { name: string }[];
    shapers?: { name: string; url?: string }[];
    beerSpots?: { name: string; url?: string }[];
  };
  isLocked?: boolean; // If true, disable hover effects and hide video titles
}

function MediaGridBase({
  videos = [],
  beach,
  isLocked = false,
}: MediaGridProps) {

  // Ensure videos is always an array and has the correct shape
  const beachVideos =
    Array.isArray(videos) && videos
      ? videos.filter(
          (video) =>
            video &&
            typeof video.url === "string" &&
            typeof video.title === "string" &&
            (video.platform === "youtube" || video.platform === "vimeo")
        )
      : [];

  // Ads removed - no longer fetching ads

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

  // Combine all services (ads removed)
  const services = [...regularServices];

  // Adventure services removed (was ad-based)
  const adventureServices: any[] = [];

  return (
    <div className="space-y-6">

      {/* Beach Videos Section */}
      {beachVideos.length > 0 ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Videos</h4>
            <span className="text-[10px] font-bold text-slate-400">{beachVideos.length} Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {beachVideos.map((video, index) => (
              <a
                key={`video-${index}`}
                href={isLocked ? "#" : video.url}
                target={isLocked ? undefined : "_blank"}
                rel={isLocked ? undefined : "noopener noreferrer"}
                onClick={isLocked ? (e) => e.preventDefault() : undefined}
                className="group/video block relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-500 hover:shadow-md hover:border-brand-3/30 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="flex p-3 gap-3">
                  {/* Video Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <Image
                      src={getVideoThumbnail(video.url, video.platform)}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover/video:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover/video:scale-110">
                        <Play className="w-3.5 h-3.5 text-brand-3 fill-brand-3 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">
                        {video.platform}
                      </span>
                    </div>
                    
                    <h3 className="text-[11px] font-black text-slate-900 uppercase line-clamp-2 leading-tight">
                      {video.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-center self-center pl-1 text-slate-300 group-hover/video:text-brand-3 transition-colors">
                     <ArrowUpRight className="w-4 h-4 transform group-hover/video:translate-x-0.5 group-hover/video:-translate-y-0.5 transition-transform" />
                  </div>
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
      {/* Local Services Section */}
      {services.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Local Services</h4>
            <span className="text-[10px] font-bold text-slate-400">{services.length} Spots</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.filter(Boolean).map((service, index) => {
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
                  className="group/service block relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-500 hover:shadow-md hover:border-brand-3/30 hover:-translate-y-0.5 active:scale-[0.98]"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="flex p-4 gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0 border border-slate-100 group-hover/service:bg-white group-hover/service:border-brand-3/20 transition-colors">
                      {emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">
                          {service.category}
                        </span>
                      </div>
                      
                      <h3 className="text-[12px] font-black text-slate-900 uppercase truncate">
                        {service.name}
                      </h3>
                      
                      <p className="text-[10px] text-slate-500 font-medium">
                         {beach.region?.name}
                      </p>
                    </div>

                    <div className="flex items-center justify-center self-center pl-1 text-slate-300 group-hover/service:text-brand-3 transition-colors">
                       <ArrowUpRight className="w-4 h-4 transform group-hover/service:translate-x-0.5 group-hover/service:-translate-y-0.5 transition-transform" />
                    </div>
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


// Instead, export MediaGridBase directly
export const MediaGrid = MediaGridBase;
