"use client";

import { useBeach } from "@/app/context/BeachContext";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { SurfSpotsWidgetProps } from "@/app/types/blog";

export default function SurfSpotsWidget({
  title,
  region,
}: SurfSpotsWidgetProps) {
  const { beaches } = useBeach();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter beaches by region from database
  const regionBeaches = beaches.filter(
    (beach) => beach.region?.name === region
  );

  if (!regionBeaches.length) {
    return null;
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % regionBeaches.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? regionBeaches.length - 1 : prev - 1
    );
  };

  const currentBeach = regionBeaches[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 font-primary">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title || "Local Surf Spots"}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevSlide}
            className={cn(
              "p-1 rounded-full transition-colors",
              "hover:bg-gray-100 active:bg-gray-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={regionBeaches.length <= 1}
            aria-label="Previous surf spot"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {regionBeaches.length}
          </span>
          <button
            type="button"
            onClick={nextSlide}
            className={cn(
              "p-1 rounded-full transition-colors",
              "hover:bg-gray-100 active:bg-gray-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={regionBeaches.length <= 1}
            aria-label="Next surf spot"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          key={currentBeach.id}
          className="surf-spot-card bg-gray-50 rounded-lg p-4 transition-all duration-300"
        >
          <h4 className="font-medium text-base mb-3">{currentBeach.name}</h4>
          <div className="space-y-2.5 text-sm text-gray-600">
            <p className="flex justify-between items-center">
              <span>Best Wind</span>
              <span className="font-medium text-gray-900">
                {currentBeach.optimalWindDirections.join(", ")}
              </span>
            </p>
            <p className="flex justify-between items-center">
              <span>Best Swell</span>
              <span className="font-medium text-gray-900">
                {currentBeach.optimalSwellDirections.cardinal}
              </span>
            </p>
            <p className="flex justify-between items-center">
              <span>Best Tide</span>
              <span className="font-medium text-gray-900">
                {currentBeach.optimalTide}
              </span>
            </p>
            <p className="flex justify-between items-center">
              <span>Difficulty</span>
              <span className="font-medium text-gray-900">
                {currentBeach.difficulty}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
