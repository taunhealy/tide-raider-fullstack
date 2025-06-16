// app/components/StickyForecastWidget.tsx
"use client";

import { useBeach } from "@/app/context/BeachContext";
import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useQuery } from "@tanstack/react-query";

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
    <>
      {/* Blurred background bar */}
      <div className="fixed bottom-0 left-0 right-0 h-45 bg-white/70 backdrop-blur-md" />

      {/* Widgets container */}
      <div
        ref={widgetRef}
        className="fixed bottom-9 left-2 right-9 z-40 flex justify-center gap-4"
      >
        {/* Sponsor Carousel */}
        <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200 w-32">
          <h4 className="text-sm font-semibold font-primary text-[var(--color-primary)] mb-2">
            Sponsored by
          </h4>
          <div className="relative h-12">
            {sponsors.length > 0 ? (
              sponsors.map((sponsor: Sponsor, index: number) => (
                <a
                  key={sponsor.id}
                  href={sponsor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-sponsor-index={index}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {!sponsor.logo ? (
                    <span className="text-2xl">🐬</span>
                  ) : (
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="max-h-8 max-w-full object-contain"
                    />
                  )}
                </a>
              ))
            ) : (
              <a
                href="https://www.kealogic.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-xs font-regular font-primary text-[var(--color-primary)] bg-cyan-50 px-3 py-1 rounded-full">
                  Kea Logic
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Forecast Widget */}
        <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200 max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold font-primary text-[var(--color-primary)]">
              Today's Forecast
            </h4>
            <span className="text-xs text-gray-500 font-primary">
              {forecast.region}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-md flex-1">
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
            <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-md flex-1">
              <span className="text-blue-800">🧭</span>
              <div>
                <span className="text-gray-600 font-primary">Direction</span>
                <p className="font-medium text-blue-800 font-primary">
                  {degreesToCardinal(forecast.windDirection)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-cyan-50 p-2 rounded-md flex-1">
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
            <div className="flex items-center space-x-2 bg-cyan-50 p-2 rounded-md flex-1">
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
