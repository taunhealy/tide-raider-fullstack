"use client";

import { useState } from "react";
import Image from "next/image";

interface UnsplashImage {
  id: string;
  urls: {
    small: string;
  };
  alt_description: string;
}

interface UnsplashGridWidgetProps {
  title: string;
  images: UnsplashImage[];
}

export default function UnsplashGridWidget({ title }: UnsplashGridWidgetProps) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (loading || images.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {images.map((image) => (
          <div
            key={image.id}
            className="aspect-square relative overflow-hidden rounded"
          >
            <Image
              src={image.urls.small}
              alt={image.alt_description || "Unsplash image"}
              fill
              className="object-cover hover:scale-110 transition-transform duration-300"
              unoptimized={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
