"use client";

import { useState } from "react";
import Image from "next/image";

interface RentalImagesDisplayProps {
  thumbnail: string | null;
  images: string[];
  itemName: string;
}

export function RentalImagesDisplay({
  thumbnail,
  images,
  itemName,
}: RentalImagesDisplayProps) {
  const [currentImage, setCurrentImage] = useState(
    thumbnail || (images.length > 0 ? images[0] : null)
  );

  // Filter out the thumbnail from the images array if it exists in both
  const additionalImages = thumbnail
    ? images.filter((img) => img !== thumbnail)
    : images;

  return (
    <div className="space-y-4">
      <div className="relative h-80 bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden border border-[var(--color-border-light)]">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={itemName}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <span className="text-gray-400 font-primary">No image</span>
          </div>
        )}
      </div>

      {additionalImages.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {additionalImages.map((imageId) => (
            <div
              key={imageId}
              className="relative h-20 bg-[var(--color-bg-secondary)] rounded overflow-hidden border border-[var(--color-border-light)] cursor-pointer"
              onMouseEnter={() => setCurrentImage(imageId)}
              onMouseLeave={() =>
                setCurrentImage(
                  thumbnail || (images.length > 0 ? images[0] : null)
                )
              }
            >
              <Image
                src={imageId}
                alt={itemName}
                fill
                sizes="25vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
