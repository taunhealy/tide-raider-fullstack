// app/components/StickyForecastWidget.tsx
"use client";

import { useBeach } from "@/app/context/BeachContext";
import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function StickyForecastWidget() {
  // Add try-catch for context usage
  let contextData;
  try {
    contextData = useBeach();
  } catch (error) {
    // If context is not available, don't render the widget
    return null;
  }

  const { forecastData: windData, filters } = contextData;
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // Create the animation
    const anim = gsap.to(widgetRef.current, {
      yPercent: 100,
      opacity: 0,
      duration: 0.3,
      ease: "power2.inOut",
      paused: true, // Start paused
    });

    // Create ScrollTrigger
    ScrollTrigger.create({
      start: "top top",
      end: "max",
      onUpdate: (self) => {
        // Show when scrolling down, hide when scrolling up
        if (self.direction === 1) {
          anim.reverse(); // Show
        } else {
          anim.play(); // Hide
        }
      },
    });

    return () => {
      // Cleanup
      anim.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Format the data for display with fallback values
  const forecast = {
    date: new Date(),
    region: filters.location.region || "Global",
    windSpeed: windData?.windSpeed || 0,
    windDirection: windData?.windDirection || 0,
    swellHeight: windData?.swellHeight || 0,
    swellPeriod: windData?.swellPeriod || 0,
    swellDirection: windData?.swellDirection || 0,
  };

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-9 right-4 z-40 bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-xs"
    >
      <div className="flex items-center justify-between mb-3 min-w-5 gap-5">
        <h4 className="text-sm font-semibold font-primary text-[var(--color-primary)]">
          Today's Forecast
        </h4>
        <span className="text-xs text-gray-500 font-primary">
          {forecast.region}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-md">
          <span className="text-blue-800">
            {getWindEmoji(forecast.windSpeed)}
          </span>
          <div>
            <span className="text-gray-600 font-primary">Wind</span>
            <p className="font-medium text-blue-800 font-primary">
              {forecast.windSpeed} kts
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-md">
          <span className="text-blue-800">🧭</span>
          <div>
            <span className="text-gray-600 font-primary">Direction</span>
            <p className="font-medium text-blue-800 font-primary">
              {degreesToCardinal(forecast.windDirection)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-cyan-50 p-2 rounded-md">
          <span className="text-cyan-800">
            {getSwellEmoji(forecast.swellHeight)}
          </span>
          <div>
            <span className="text-gray-600 font-primary">Swell</span>
            <p className="font-medium text-cyan-800 font-primary">
              {forecast.swellHeight}m,{" "}
              {degreesToCardinal(forecast.swellDirection)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-cyan-50 p-2 rounded-md">
          <span className="text-cyan-800">⏱️</span>
          <div>
            <span className="text-gray-600 font-primary">Period</span>
            <p className="font-medium text-cyan-800 font-primary">
              {forecast.swellPeriod}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
