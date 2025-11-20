"use client";

import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { Video as VideoIcon, X } from "lucide-react";
import Image from "next/image";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { CustomVideoPlayer } from "./CustomVideoPlayer";

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  videoUrl?: string | null;
  videoPlatform?: "youtube" | "vimeo" | null;
}

export function MediaModal({
  isOpen,
  onClose,
  imageUrl,
  videoUrl,
  videoPlatform,
}: MediaModalProps) {
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
          {imageUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <Image
                src={imageUrl}
                alt="Session photo"
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
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
