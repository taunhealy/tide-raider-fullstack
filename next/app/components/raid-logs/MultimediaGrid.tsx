"use client";

import Image from "next/image";
import { Video as VideoIcon, Play } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getVideoThumbnail } from "@/app/lib/videoUtils";

import { VideoPlatform } from "@/app/types/raidlogs";

interface MultimediaGridProps {
  images: string[];
  videos: { url: string; type: VideoPlatform; thumbnail?: string }[];
  onMediaClick: (category: "image" | "video", index: number) => void;
  className?: string;
}

export function MultimediaGrid({
  images,
  videos,
  onMediaClick,
  className,
}: MultimediaGridProps) {
  // Combine media into a single array for unified rendering
  // We want to preserve original indices for the click handlers
  // Filtering ensures we don't crash on null/empty data from the backend
  const allMedia = [
    ...videos
      .filter(v => v && v.url && v.url.trim() !== "")
      .map((video, index) => ({ 
        category: "video" as const, 
        url: video.url, 
        platformType: video.type, 
        thumbnail: video.thumbnail, 
        index 
      })),
    ...images
      .filter(url => typeof url === "string" && url.trim() !== "")
      .map((url, index) => ({ 
        category: "image" as const, 
        url, 
        index 
      })),
  ];

  if (allMedia.length === 0) return null;

  const heroMedia = allMedia[0];
  const gridMedia = allMedia.slice(1);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Hero Media - Large and Professional */}
      <div 
        className="relative aspect-video w-full rounded-3xl overflow-hidden border border-white/10 cursor-pointer group shadow-2xl bg-black"
        onClick={() => onMediaClick(heroMedia.category, heroMedia.index)}
      >
        {heroMedia.category === "image" ? (
          <Image
            src={heroMedia.url}
            alt="Hero session media"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            priority
            sizes="100vw"
          />
        ) : (
          <>
            <Image
              src={heroMedia.thumbnail || getVideoThumbnail(heroMedia.url, heroMedia.platformType)}
              alt="Hero session video"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
              <div className="bg-white/90 rounded-full p-5 shadow-2xl transform group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-[var(--color-tertiary)] fill-[var(--color-tertiary)]" />
              </div>
            </div>
          </>
        )}
        <div className="absolute top-6 left-6 flex gap-2">
           <span className="bg-black/60 backdrop-blur-md text-[10px] text-white font-bold px-3 py-1 rounded-full font-primary border border-white/10 uppercase tracking-widest">
            {heroMedia.category === "image" ? "Featured Photo" : "Featured Video"}
          </span>
        </div>
      </div>

      {/* Grid for Remaining Media */}
      {gridMedia.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gridMedia.map((media, idx) => (
            <div
              key={`${media.category}-${idx}`}
              className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 cursor-pointer group hover:border-[var(--color-tertiary)]/50 transition-all bg-black shadow-lg"
              onClick={() => onMediaClick(media.category, media.index)}
            >
              {media.category === "image" ? (
                <Image
                  src={media.url}
                  alt={`Session media ${idx + 2}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <>
                  <Image
                    src={media.thumbnail || getVideoThumbnail(media.url, media.platformType)}
                    alt={`Session video ${idx + 2}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                    <div className="bg-white/90 rounded-full p-2 shadow-lg transform group-hover:scale-110 transition-transform">
                      <VideoIcon className="w-4 h-4 text-[var(--color-tertiary)]" />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
