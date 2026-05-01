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
  videoPlatform?: "youtube" | "vimeo" | "short" | "upload" | null;
  videoUrls?: { url: string; type: string; thumbnail?: string }[];
  initialImageIndex?: number;
  initialVideoIndex?: number;
  initialType?: "image" | "video";
}

export function MediaModal({
  isOpen,
  onClose,
  imageUrl,
  imageUrls,
  videoUrl,
  videoPlatform,
  videoUrls = [],
  initialImageIndex = 0,
  initialVideoIndex = 0,
  initialType = "image",
}: MediaModalProps) {
  // Support both single imageUrl and imageUrls array
  const images = (imageUrls && imageUrls.length > 0) ? imageUrls : (imageUrl ? [imageUrl] : []);
  
  // Normalize videos
  const videos = videoUrls.length > 0 ? videoUrls : (videoUrl ? [{ url: videoUrl, type: videoPlatform || "upload" }] : []);

  const [currentType, setCurrentType] = useState<"image" | "video">(initialType);
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex);

  // Update indices when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentType(initialType);
      setCurrentImageIndex(initialImageIndex);
      setCurrentVideoIndex(initialVideoIndex);
    }
  }, [isOpen, initialType, initialImageIndex, initialVideoIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          if (currentType === "image" && images.length > 1) {
            setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
          } else if (currentType === "video" && videos.length > 1) {
            setCurrentVideoIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
          }
        } else if (e.key === "ArrowRight") {
          if (currentType === "image" && images.length > 1) {
            setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
          } else if (currentType === "video" && videos.length > 1) {
            setCurrentVideoIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
          }
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
  }, [isOpen, currentType, images.length, videos.length, onClose]);

  const handleEmbedVideo = (url: string, platform: string) => {
    if (!url || !platform) return null;

    if (platform === "youtube" || platform === "short") {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = match && match[2].length === 11 ? match[2] : null;

      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
    }

    if (platform === "vimeo") {
      const videoId = url.split("/").pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : null;
    }

    return null;
  };

  const getModalTitle = () => {
    if (currentType === "image") return `Photo ${currentImageIndex + 1} of ${images.length}`;
    return `Video ${currentVideoIndex + 1} of ${videos.length}`;
  };

  const currentVideo = videos[currentVideoIndex];
  const embedUrl = currentVideo ? handleEmbedVideo(currentVideo.url, currentVideo.type) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !p-0 overflow-hidden bg-black border-0 z-[100] !translate-x-0 !translate-y-0 rounded-none !left-0 !top-0"
      >
        <DialogTitle className="sr-only">{getModalTitle()}</DialogTitle>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[110] p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all duration-200 backdrop-blur-sm group"
        >
          <X className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
        </button>

        {/* Media Selector (if both exist) */}
        {images.length > 0 && videos.length > 0 && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] flex gap-2 bg-white/10 p-1 rounded-full backdrop-blur-md border border-white/10">
            <button
              onClick={() => setCurrentType("image")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                currentType === "image" ? "bg-white text-black" : "text-white hover:bg-white/10"
              )}
            >
              PHOTOS
            </button>
            <button
              onClick={() => setCurrentType("video")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                currentType === "video" ? "bg-white text-black" : "text-white hover:bg-white/10"
              )}
            >
              VIDEOS
            </button>
          </div>
        )}

        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
          {currentType === "image" && images.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={images[currentImageIndex]}
                alt="Session photo"
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 z-[110] transition-all"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 z-[110] transition-all"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0 max-w-5xl aspect-video"
                  title="Video player"
                />
              ) : currentVideo?.type === "upload" ? (
                <CustomVideoPlayer videoUrl={currentVideo.url} className="w-full h-full max-w-5xl" />
              ) : (
                <div className="text-white">Video not available</div>
              )}

              {videos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentVideoIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1))}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 z-[110] transition-all"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    onClick={() => setCurrentVideoIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1))}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 z-[110] transition-all"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
