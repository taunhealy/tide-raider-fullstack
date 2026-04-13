"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
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
  initialImageIndex?: number;
}

export function MediaModal({
  isOpen,
  onClose,
  imageUrl,
  imageUrls,
  videoUrl,
  videoPlatform,
  initialImageIndex = 0,
}: MediaModalProps) {
  // Support both single imageUrl and imageUrls array
  const images = (imageUrls && imageUrls.length > 0) ? imageUrls : (imageUrl ? [imageUrl] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);

  // Update current image index when modal opens with a new initial index
  useEffect(() => {
    if (isOpen && typeof initialImageIndex === "number") {
      setCurrentImageIndex(initialImageIndex);
    }
  }, [isOpen, initialImageIndex]);

  // Keyboard navigation and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft" && images.length > 1) {
          setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        } else if (e.key === "ArrowRight" && images.length > 1) {
          setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        } else if (e.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, images.length, onClose]);

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

  // Determine the title based on content type
  const getModalTitle = () => {
    if (images.length > 0) {
      return `Session photo ${currentImageIndex + 1} of ${images.length}`;
    }
    if (videoUrl && videoPlatform) {
      return "Session video";
    }
    if (videoUrl) {
      return "Session video";
    }
    return "Session media";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !p-0 overflow-hidden bg-black border-0 z-[100] !translate-x-0 !translate-y-0 rounded-none !left-0 !top-0"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        {/* DialogTitle for accessibility - visually hidden but accessible to screen readers */}
        <DialogTitle className="sr-only">{getModalTitle()}</DialogTitle>

        {/* Close Button - Enhanced visibility */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[110] p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-200 backdrop-blur-sm group"
          aria-label="Close modal"
          title="Close (Esc)"
        >
          <X className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
        </button>

        {/* Tide Raider Logo/Branding */}
        <div className="absolute top-4 left-4 z-30 px-3 py-1.5 bg-black/80 border border-[var(--color-tertiary)]/50 rounded-md backdrop-blur-sm">
          <span className="text-white font-primary font-bold text-sm tracking-wide">
            TIDE <span className="text-[var(--color-tertiary)]">RAIDER</span>
          </span>
        </div>

        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
          {images.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[currentImageIndex]}
                alt={`Session photo ${currentImageIndex + 1} of ${images.length}`}
                fill
                className="object-contain"
                sizes="100vw"
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
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full p-4 transition-all duration-200 z-[110] backdrop-blur-sm group"
                    aria-label="Previous image"
                    title="Previous (Left arrow)"
                  >
                    <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full p-4 transition-all duration-200 z-[110] backdrop-blur-sm group"
                    aria-label="Next image"
                    title="Next (Right arrow)"
                  >
                    <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
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
                title="Open video in new tab"
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
