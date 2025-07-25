// app/components/StickyForecastWidget.tsx
"use client";

import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function StickyForecastWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const regionId = searchParams.get("regionId");
  const regionName = searchParams.get("region");

  // Replace useFilteredBeaches with direct forecast query
  const { data: forecastData, isLoading } = useQuery({
    queryKey: ["forecast", regionId],
    queryFn: async () => {
      const response = await fetch(`/api/forecast?regionId=${regionId}`);
      if (!response.ok) throw new Error("Failed to fetch forecast");
      return response.json();
    },
    enabled: !!regionId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: sponsors = [] } = useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const response = await fetch("/api/sponsors");
      if (!response.ok) throw new Error("Failed to fetch sponsors");
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

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

  // Add sponsor animation effect
  useEffect(() => {
    if (sponsors.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sponsors.length]);

  useEffect(() => {
    if (sponsors.length === 0) return;
    const currentSponsor = document.querySelector(
      `[data-sponsor-index="${currentIndex}"]`
    );
    if (!currentSponsor) return;
    gsap.fromTo(
      currentSponsor,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
    return () => {
      gsap.to(currentSponsor, { opacity: 0, y: -20, duration: 0.3 });
    };
  }, [currentIndex, sponsors.length]);

  return (
    <>
      {/* Blurred background bar - hide on mobile */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 h-45 bg-white/70 backdrop-blur-md" />

      {/* Widgets container - hide on mobile */}
      <div
        ref={widgetRef}
        className="hidden md:flex fixed bottom-9 left-2 right-9 z-40 justify-center gap-2"
      >
        {/* Forecast Widget */}
        <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200 max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold font-primary text-[var(--color-primary)]">
              Today's Forecast
            </h4>
            <span className="text-xs text-gray-500 font-primary">
              {regionName}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-md flex-1">
              <span className="text-blue-800">
                {getWindEmoji(forecastData?.windSpeed ?? 0)}
              </span>
              <div>
                <span className="text-gray-600 font-primary">Wind</span>
                <p className="font-medium text-blue-800 font-primary">
                  {forecastData?.windSpeed ?? 0} kts
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-md flex-1">
              <span className="text-blue-800">🧭</span>
              <div>
                <span className="text-gray-600 font-primary">Direction</span>
                <p className="font-medium text-blue-800 font-primary">
                  {degreesToCardinal(forecastData?.windDirection ?? 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-cyan-50 p-2 rounded-md flex-1">
              <span className="text-cyan-800">
                {getSwellEmoji(forecastData?.swellHeight ?? 0)}
              </span>
              <div>
                <span className="text-gray-600 font-primary">Swell</span>
                <p className="font-medium text-cyan-800 font-primary">
                  {forecastData?.swellHeight ?? 0}m,{" "}
                  {degreesToCardinal(forecastData?.swellDirection ?? 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-cyan-50 p-2 rounded-md flex-1">
              <span className="text-cyan-800">⏱️</span>
              <div>
                <span className="text-gray-600 font-primary">Period</span>
                <p className="font-medium text-cyan-800 font-primary">
                  {forecastData?.swellPeriod ?? 0}s
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  link: string;
}
