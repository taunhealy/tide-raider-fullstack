"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import Image from "next/image";

interface VideoThumbnailProps {
  videoUrl: string;
  className?: string;
  onPlay?: () => void;
}

/**
 * VideoThumbnail component that generates a 360p thumbnail from video
 * Plays video on hover to minimize server costs (only loads when hovered)
 * Maintains 16:9 aspect ratio
 */
export function VideoThumbnail({
  videoUrl,
  className = "",
  onPlay,
}: VideoThumbnailProps) {
  const thumbnailVideoRef = useRef<HTMLVideoElement>(null); // For thumbnail generation
  const playbackVideoRef = useRef<HTMLVideoElement>(null); // For hover playback
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.matchMedia("(pointer: coarse)").matches
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Intersection Observer for mobile auto-play
  useEffect(() => {
    if (!isMobile || !containerRef.current || !playbackVideoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setIsInView(true);
            playbackVideoRef.current?.play().catch((error) => {
              console.error(
                "[VideoThumbnail] Error playing video on scroll:",
                error
              );
            });
          } else {
            setIsInView(false);
            playbackVideoRef.current?.pause();
            playbackVideoRef.current &&
              (playbackVideoRef.current.currentTime = 0);
          }
        });
      },
      {
        threshold: 0.5, // Play when 50% visible
        rootMargin: "0px",
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isMobile, videoUrl]);

  // Generate thumbnail from video
  useEffect(() => {
    if (!thumbnailVideoRef.current || !canvasRef.current || !videoUrl) return;

    const video = thumbnailVideoRef.current;
    const canvas = canvasRef.current;

    // Set canvas to 360p (640x360) - maintains 16:9 aspect ratio
    canvas.width = 640;
    canvas.height = 360;

    let isMounted = true;

    const generateThumbnail = () => {
      if (!isMounted) return;

      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          console.error("[VideoThumbnail] Could not get canvas context");
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
          return;
        }

        // Check if video is ready
        if (video.readyState < 2) {
          // Video not ready yet, wait a bit
          setTimeout(() => {
            if (isMounted && video.readyState >= 2) {
              generateThumbnail();
            }
          }, 100);
          return;
        }

        // Draw video frame at 360p resolution
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL("image/jpeg", 0.7); // 70% quality

        if (isMounted && thumbnail) {
          setThumbnailUrl(thumbnail);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[VideoThumbnail] Error generating thumbnail:", error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (!isMounted) return;
      // Seek to first frame (0.1 seconds to avoid black frames)
      video.currentTime = 0.1;
    };

    const handleSeeked = () => {
      if (!isMounted) return;
      generateThumbnail();
    };

    const handleError = (e: Event) => {
      console.error("[VideoThumbnail] Video error:", e);
      if (isMounted) {
        setHasError(true);
        setIsLoading(false);
      }
    };

    const handleCanPlay = () => {
      if (!isMounted) return;
      // Try to generate thumbnail when video can play
      if (video.readyState >= 2) {
        generateThumbnail();
      }
    };

    // Set up event listeners
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", handleCanPlay);

    // Load the video
    video.load();

    // Cleanup
    return () => {
      isMounted = false;
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [videoUrl]);

  // Handle hover to play/pause video (desktop only)
  const handleMouseEnter = () => {
    if (isMobile) return; // Ignore hover on mobile
    setIsHovered(true);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.play().catch((error) => {
        console.error("[VideoThumbnail] Error playing video on hover:", error);
      });
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return; // Ignore hover on mobile
    setIsHovered(false);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.pause();
      playbackVideoRef.current.currentTime = 0; // Reset to start
    }
  };

  if (hasError) {
    return (
      <div
        className={`relative w-full h-full bg-gray-900 rounded-md flex items-center justify-center ${className}`}
      >
        <Play className="w-12 h-12 text-white opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-md" />
      </div>
    );
  }

  // Determine if video should be visible (hover for desktop, inView for mobile)
  const shouldShowVideo = isMobile ? isInView : isHovered;

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hidden video element for thumbnail generation */}
      <video
        ref={thumbnailVideoRef}
        src={videoUrl}
        preload="metadata"
        muted
        playsInline
        className="hidden"
        crossOrigin="anonymous"
        onError={(e) => {
          console.error("[VideoThumbnail] Video load error:", e);
          setHasError(true);
          setIsLoading(false);
        }}
      />
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Playback video element - plays on hover (desktop) or when in view (mobile) */}
      <video
        ref={playbackVideoRef}
        src={videoUrl}
        preload="none"
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover rounded-md transition-opacity ${
          shouldShowVideo ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
        crossOrigin="anonymous"
      />

      {/* Display thumbnail or loading state */}
      {thumbnailUrl ? (
        <div className="relative w-full h-full rounded-md overflow-hidden">
          {/* Thumbnail image - hidden when video is playing */}
          <Image
            src={thumbnailUrl}
            alt="Video thumbnail"
            fill
            className={`object-cover rounded-md transition-opacity ${
              shouldShowVideo ? "opacity-0" : "opacity-100"
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Play icon overlay - shows when video is not playing */}
          {!shouldShowVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 hover:bg-black/20 transition-colors rounded-md">
              <div className="bg-white/90 rounded-full p-3 mb-2">
                <Play className="w-6 h-6 text-gray-900 fill-gray-900" />
              </div>
              <span className="text-white text-xs font-primary font-medium">
                {isMobile ? "Scroll to play" : "Hover to play"}
              </span>
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="relative w-full h-full bg-gray-900 rounded-md flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="relative w-full h-full bg-gray-900 rounded-md flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-70" />
        </div>
      )}
    </div>
  );
}
