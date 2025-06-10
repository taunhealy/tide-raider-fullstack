// app/components/StickyForecastWidget.tsx
"use client";

import { useBeach } from "@/app/context/BeachContext";
import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";
import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/app/lib/utils";

export default function StickyForecastWidget() {
  // Add try-catch for context usage
  let contextData;
  try {
    contextData = useBeach();
  } catch (error) {
    // If context is not available, don't render the widget
    return null;
  }

  const { forecastData: windData, selectedRegion } = contextData;
  const widgetRef = useRef<HTMLDivElement>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAtEdge, setIsAtEdge] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      if (!widgetRef.current) return;

      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      const isAtTop = currentScrollY < 100;
      const isAtBottom =
        window.innerHeight + currentScrollY >=
        document.documentElement.scrollHeight - 100;

      // Handle edge cases (top/bottom of page)
      if (isAtTop || isAtBottom) {
        if (!isAtEdge) {
          gsap.to(widgetRef.current, {
            y: 100,
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
          });
          setIsAtEdge(true);
        }
      } else {
        // Normal scroll behavior
        if (isAtEdge) {
          // Coming back from edge
          gsap.to(widgetRef.current, {
            y: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
          });
          setIsAtEdge(false);
        } else {
          // Regular scroll animation
          gsap.to(widgetRef.current, {
            y: scrollingDown ? 0 : 100,
            opacity: scrollingDown ? 1 : 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      }

      setLastScrollY(currentScrollY);
    };

    // Add scroll event listener with throttling
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    // Initial state
    if (widgetRef.current) {
      gsap.set(widgetRef.current, {
        y: 0,
        opacity: 1,
      });
    }

    window.addEventListener("scroll", throttledScroll);
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [lastScrollY, isAtEdge]);

  // Format the data for display with fallback values
  const forecast = {
    date: new Date(),
    region: selectedRegion || "Global",
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
      <div className="flex items-center justify-between mb-3">
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
              {forecast.swellHeight}m
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
