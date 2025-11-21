"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { Video as VideoIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { CustomVideoPlayer } from "./CustomVideoPlayer";
import { cn } from "@/app/lib/utils";

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  imageUrls?: string[];
  videoUrl?: string | null;
  videoPlatform?: "youtube" | "vimeo" | null;
}

export function MediaModal({
  isOpen,
  onClose,
  imageUrl,
  imageUrls,
  videoUrl,
  videoPlatform,
}: MediaModalProps) {
  // Support both single imageUrl and imageUrls array
  const images = imageUrls || (imageUrl ? [imageUrl] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const handleEmbedVideo = () => {
    if (!videoUrl || !videoPlatform) return null;

    if (videoPlatform === "youtube") {
      const videoId = videoUrl.includes("youtu.be")
        ? videoUrl.split("/").pop()
        : videoUrl.includes("v=")
          ? new URLSearchParams(videoUrl.split("?")[1]).get("v")
          : null;

      return videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
        : null;
    }

    if (videoPlatform === "vimeo") {
      const videoId = videoUrl.split("/").pop();
      return videoId
        ? `https://player.vimeo.com/video/${videoId}?autoplay=1`
        : null;
    }

    return null;
  };

  const embedUrl = videoUrl && videoPlatform ? handleEmbedVideo() : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] lg:max-w-[85vw] xl:max-w-[80vw] max-h-[95vh] p-0 overflow-hidden relative bg-black border-2 border-[var(--color-tertiary)]/30">
        {/* Close Button - Tide Raider Branded */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 bg-black/80 hover:bg-[var(--color-tertiary)]/20 border border-[var(--color-tertiary)]/50 hover:border-[var(--color-tertiary)] rounded-full p-2 transition-all duration-200 shadow-lg backdrop-blur-sm"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-white hover:text-[var(--color-tertiary)] transition-colors" />
        </button>

        {/* Tide Raider Logo/Branding */}
        <div className="absolute top-4 left-4 z-30 px-3 py-1.5 bg-black/80 border border-[var(--color-tertiary)]/50 rounded-md backdrop-blur-sm">
          <span className="text-white font-primary font-bold text-sm tracking-wide">
            TIDE <span className="text-[var(--color-tertiary)]">RAIDER</span>
          </span>
        </div>

        <div className="relative w-full aspect-video min-h-[60vh] lg:min-h-[70vh]">
          {images.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[currentImageIndex]}
                alt={`Session photo ${currentImageIndex + 1} of ${images.length}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition-colors z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          index === currentImageIndex
                            ? "bg-white w-8"
                            : "bg-white/50 hover:bg-white/75"
                        )}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="absolute top-4 right-16 bg-black/70 text-white text-sm px-3 py-1.5 rounded z-10 font-primary">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
              title="Video player"
            />
          ) : videoUrl && videoUrl.trim() !== "" && !videoPlatform ? (
            // Uploaded video (no platform) - show custom video player with full controls
            <CustomVideoPlayer videoUrl={videoUrl} className="w-full h-full" />
          ) : videoUrl && videoUrl.trim() !== "" && videoPlatform ? (
            <div className="flex items-center justify-center h-full">
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-full max-w-2xl aspect-video"
              >
                <Image
                  src={getVideoThumbnail(videoUrl, videoPlatform)}
                  alt="Video thumbnail"
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
                  <div className="bg-white/90 rounded-full p-5">
                    <VideoIcon className="w-10 h-10 text-[var(--color-tertiary)]" />
                  </div>
                </div>
              </a>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-primary">
              No media available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
