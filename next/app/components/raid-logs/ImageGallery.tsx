"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ImageGalleryProps {
  images: string[];
  className?: string;
  onImageClick?: (index: number) => void;
  showControls?: boolean;
}

export function ImageGallery({
  images,
  className = "",
  onImageClick,
  showControls = true,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!images || images.length === 0) return null;

  // Single image - large, professional display
  if (images.length === 1) {
    return (
      <div
        className={cn(
          "relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300",
          className
        )}
      >
        <Image
          src={images[0]}
          alt="Session photo"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 1024px) 100vw, 100vw"
          priority
          onClick={() => onImageClick?.(0)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
    );
  }

  // Mobile: Slider view
  if (isMobile) {
    return (
      <div
        className={cn(
          "relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100",
          className
        )}
      >
        <div className="relative w-full h-full">
          <Image
            src={images[currentIndex]}
            alt={`Session photo ${currentIndex + 1} of ${images.length}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority={currentIndex === 0}
            onClick={() => onImageClick?.(currentIndex)}
          />

          {showControls && images.length > 1 && (
            <>
              {/* Navigation arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1
                  );
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1
                  );
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex
                        ? "bg-white w-6"
                        : "bg-white/50 hover:bg-white/75"
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              {/* Image counter */}
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10 font-primary">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Desktop: Professional grid view with larger images
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-95 transition-all duration-300 group shadow-md hover:shadow-xl"
            onClick={() => onImageClick?.(index)}
          >
            <Image
              src={image}
              alt={`Session photo ${index + 1} of ${images.length}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={index < 3}
            />
            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
