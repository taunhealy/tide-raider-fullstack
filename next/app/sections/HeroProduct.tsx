"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";
import { Beach } from "../types/beaches";
import { getConditionReasons, degreesToCardinal } from "../lib/surfUtils";
import { calculateBeachScore, getScoreDisplay } from "../lib/scoreUtils";
import type { BaseForecastData } from "../types/forecast";
import {
  getWindEmoji,
  getSwellEmoji,
  getDirectionEmoji,
} from "@/app/lib/forecastUtils";
import gsap from "gsap";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/app/components/ui/Button";
import { urlForImage } from "@/app/lib/urlForImage";
import Link from "next/link";
import {
  Bell,
  Star,
  ImageIcon,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react";

const FEATURED_BEACHES = [
  "jeffreys-bay",
  "muizenberg",
  "ponta-do-ouro",
  "uluwatu",
  "raglan-manu-bay",
  "cabo-ledo",
  "skeleton-bay",
  "flame-bowls",
  "llandudno",
];

export default function HeroProduct({ data }: { data?: any }) {
  const [selectedBeachId, setSelectedBeachId] = useState(FEATURED_BEACHES[0]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(1);

  const [beaches, setBeaches] = useState<Beach[]>([]);
  const currentBeach = useMemo(() => {
    if (!beaches || !selectedBeachId) return null;
    return beaches.find((beach: Beach) => beach.id === selectedBeachId) || null;
  }, [beaches, selectedBeachId]);

  // Get all unique regions from featured beaches
  const regions = [...new Set(beaches.map((b) => b.region?.name))];
  const initialRegion = regions[0];

  // Add a new state for tracking scraping process
  const [isScrapingData, setIsScrapingData] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [scrapingStatus, setScrapingStatus] = useState("");

  // Replace the fetchRegionData function to include scraping indicators
  const fetchRegionData = async (region: string) => {
    if (!region) return null;
    try {
      setIsScrapingData(true);
      setScrapingStatus(`Fetching data for ${region}...`);
      setScrapingProgress(10);

      const res = await fetch(
        `/api/surf-conditions?region=${encodeURIComponent(region)}`
      );

      setScrapingProgress(30);
      setScrapingStatus("Processing surf data...");

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      setScrapingProgress(60);
      setScrapingStatus("Analyzing conditions...");

      const data = await res.json();

      setScrapingProgress(90);
      setScrapingStatus("Finalizing results...");

      // Short delay to show the completion state
      setTimeout(() => {
        setScrapingProgress(100);
        setScrapingStatus("Complete!");
        setIsScrapingData(false);
      }, 500);

      return data;
    } catch (error) {
      console.error(`Error fetching surf conditions for ${region}:`, error);
      setScrapingStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setScrapingProgress(100);
      setIsScrapingData(false);
      return null;
    }
  };

  // Use React Query's useQueries to fetch multiple regions efficiently
  const regionQueries = useQueries({
    queries: [...new Set([initialRegion, currentBeach?.region?.name])]
      .filter(Boolean)
      .map((region) => ({
        queryKey: ["surf-conditions", region],
        queryFn: () => fetchRegionData(region as string),
        staleTime: 60 * 1000 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      })),
  });

  // Combine the data from all region queries
  const surfData = useMemo(() => {
    const regionDataMap = regionQueries.reduce(
      (acc, query, index) => {
        const region = [
          ...new Set([initialRegion, currentBeach?.region?.name]),
        ].filter(Boolean)[index];
        if (region) {
          acc[region as string] = query.data;
        }
        return acc;
      },
      {} as Record<string, BaseForecastData | null>
    );

    // Map beach IDs to their region data
    return beaches.reduce(
      (acc, beach) => {
        acc[beach.id] = regionDataMap[beach.region?.name ?? ""] || null;
        return acc;
      },
      {} as Record<string, BaseForecastData | null>
    );
  }, [beaches, regionQueries, initialRegion, currentBeach?.region?.name]);

  // Update loading state
  const isLoading = regionQueries.some((query) => query.isLoading);

  const imageRef = useRef<HTMLImageElement>(null);
  const alertCardRef = useRef<HTMLDivElement>(null);
  const logCardRef = useRef<HTMLDivElement>(null);
  const bellIconRef = useRef<SVGSVGElement>(null);
  const bookIconRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (imageRef.current) {
      gsap.to(imageRef.current, {
        scale: 1.09,
        duration: 5,
        ease: "power3.inOut",
        yoyo: true,
        repeat: -3,
      });
    }
  }, [selectedBeachId]); // Re-run when beach changes

  // Add GSAP animation for the bell icon
  useEffect(() => {
    if (bellIconRef.current) {
      gsap.to(bellIconRef.current, {
        rotation: 45, // Start with 45 degree rotation
        duration: 0,
      });

      // Create a timeline for continuous animation with jingle effect
      const bellTl = gsap.timeline({ repeat: -1 });

      bellTl
        .to(bellIconRef.current, {
          scale: 1.1,
          opacity: 1,
          stroke: "#FF8C00", // Orange color for the bell
          duration: 1,
          ease: "power1.inOut",
        })
        // Add more pronounced jingle effect
        .to(bellIconRef.current, {
          rotation: 30,
          duration: 0.1,
          ease: "power1.inOut",
        })
        .to(bellIconRef.current, {
          rotation: 60,
          duration: 0.1,
          ease: "power1.inOut",
        })
        .to(bellIconRef.current, {
          rotation: 30,
          duration: 0.1,
          ease: "power1.inOut",
        })
        .to(bellIconRef.current, {
          rotation: 60,
          duration: 0.1,
          ease: "power1.inOut",
        })
        .to(bellIconRef.current, {
          rotation: 45,
          duration: 0.1,
          ease: "power1.inOut",
        })
        .to(bellIconRef.current, {
          scale: 1,
          opacity: 0.8,
          stroke: "#000000", // Back to black
          duration: 1,
          ease: "power1.inOut",
        });
    }
  }, []);

  // Add GSAP animation for the book icon
  useEffect(() => {
    if (bookIconRef.current) {
      // Create a timeline for continuous animation
      const bookTl = gsap.timeline({ repeat: -1 });

      bookTl
        .to(bookIconRef.current, {
          y: -5,
          stroke: "var(--color-tertiary)", // Change to brand cyan color during bounce
          scale: 1.1,
          duration: 0.5,
          ease: "back.out(1.7)",
        })
        .to(bookIconRef.current, {
          y: 0,
          stroke: "#000000", // Back to black
          scale: 1,
          duration: 0.5,
          ease: "bounce.out",
        })
        .to({}, { duration: 1.5 }); // Pause before repeating
    }
  }, []);

  // Update the GSAP animation for the alert card
  useEffect(() => {
    if (alertCardRef.current) {
      // Create a timeline for the alert card animation with seamless looping
      const alertTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.5,
      });

      // Initial state
      gsap.set(alertCardRef.current, { opacity: 0, y: 20 });

      // Animation sequence
      alertTl
        .to(alertCardRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        })
        .to(
          alertCardRef.current,
          {
            scale: 1.03,
            duration: 0.7,
            ease: "power1.inOut",
            yoyo: true,
            repeat: 1,
          },
          "+=1"
        )
        // Add a smooth fade out at the end of the cycle
        .to(alertCardRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.6,
          ease: "power2.in",
          delay: 1,
        })
        // Reset position for next cycle
        .set(alertCardRef.current, {
          y: 20,
          immediateRender: false,
        });
    }
  }, []);

  // Update the GSAP animation for the log card
  useEffect(() => {
    if (logCardRef.current) {
      // Create a timeline for the log card animation with seamless looping
      const logTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.5,
      });

      // Initial state
      gsap.set(logCardRef.current, { opacity: 0, y: 20 });

      // Animation sequence
      logTl
        .to(logCardRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.3, // Slight delay compared to alert card
        })
        .to(
          logCardRef.current,
          {
            y: -5,
            duration: 0.5,
            ease: "power1.inOut",
            yoyo: true,
            repeat: 1,
          },
          "+=1"
        )
        // Add a smooth fade out at the end of the cycle
        .to(logCardRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.6,
          ease: "power2.in",
          delay: 1,
        })
        // Reset position for next cycle
        .set(logCardRef.current, {
          y: 20,
          immediateRender: false,
        });
    }
  }, []);

  // Add GSAP animation for the star icons
  useEffect(() => {
    if (logCardRef.current) {
      // Select all star icons within the log card
      const stars = logCardRef.current.querySelectorAll(".star-icons svg");

      if (stars.length) {
        // Create a staggered animation for the stars
        const starsTl = gsap.timeline({ repeat: -1 });

        starsTl
          .to(stars, {
            scale: 1.3,
            fill: "var(--color-alert-icon-rating)",
            stagger: 0.1,
            duration: 0.2,
            ease: "back.out(1.7)",
          })
          .to(stars, {
            scale: 1,
            stagger: 0.1,
            duration: 0.2,
            ease: "power1.out",
          })
          .to({}, { duration: 1.5 }); // Pause before repeating
      }
    }
  }, []);

  // Add staggered highlight effect for forecast properties in alert card
  useEffect(() => {
    if (alertCardRef.current) {
      // Select all forecast property items in the alert card
      const forecastItems = alertCardRef.current.querySelectorAll(
        ".bg-blue-100, .bg-cyan-100"
      );

      if (forecastItems.length) {
        // Create a staggered highlight animation
        const highlightTl = gsap.timeline({ repeat: -1 });

        highlightTl
          .to(forecastItems, {
            backgroundColor: "rgba(var(--color-tertiary-rgb), 0.3)",
            boxShadow: "0 0 8px rgba(var(--color-tertiary-rgb), 0.5)",
            stagger: 0.8,
            duration: 0.5,
            ease: "power1.inOut",
          })
          .to(forecastItems, {
            backgroundColor: "",
            boxShadow: "none",
            stagger: 0.8,
            duration: 0.5,
            ease: "power1.inOut",
          })
          .to({}, { duration: 1 }); // Pause before repeating
      }
    }
  }, []);

  // Add staggered highlight effect for forecast properties in log card
  useEffect(() => {
    if (logCardRef.current) {
      // Select all forecast property items in the log card
      const logItems = logCardRef.current.querySelectorAll(
        ".bg-blue-100, .bg-cyan-100"
      );

      if (logItems.length) {
        // Create a staggered highlight animation
        const logHighlightTl = gsap.timeline({ repeat: -1 });

        logHighlightTl
          .to(logItems, {
            backgroundColor: "rgba(var(--color-secondary-rgb), 0.3)",
            boxShadow: "0 0 8px rgba(var(--color-secondary-rgb), 0.5)",
            stagger: 0.8,
            duration: 0.5,
            ease: "power1.inOut",
          })
          .to(logItems, {
            backgroundColor: "",
            boxShadow: "none",
            stagger: 0.8,
            duration: 0.5,
            ease: "power1.inOut",
          })
          .to({}, { duration: 1 }); // Pause before repeating
      }
    }
  }, []);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (typeof window === "undefined") return;
      setCardsPerView(window.innerWidth < 768 ? 1 : 3);
    };

    // Run once on mount
    updateCardsPerView();

    // Only add listener if in browser
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateCardsPerView);
      return () => window.removeEventListener("resize", updateCardsPerView);
    }
  }, []);

  const getBeachScore = (beach: typeof selectedBeachId) => {
    if (!beach || !surfData?.[beach]) return null;
    const beachObj = beaches.find((b: Beach) => b.id === beach);
    return calculateBeachScore(beachObj!, surfData[beach]);
  };

  const maxIndex = Math.max(0, beaches.length - cardsPerView);

  const handlePrevious = () => {
    setSliderIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setSliderIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Find current beach data
  const currentBeachData = surfData[selectedBeachId];

  return (
    <section className="pt-16 pb-24 md:pt-20 md:pb-32 px-4 md:px-8 lg:px-16 bg-[var(--color-bg-primary)]">
      <div className="container mx-auto max-w-[1440px]">
        <div className="mb-12 md:mb-16 lg:mb-20 w-full md:w-2/3">
          <h3 className="font-primary text-xl md:text-2xl lg:text-3xl font-semibold mb-2 text-black">
            Daily surf spot recommendations
          </h3>
          <p className="font-primary text-sm md:text-base mb-6 max-w-[540px] font-normal">
            Explore beyond your regular surf break.
          </p>
          <Link href="/raid">
            <Button
              variant="default"
              size="default"
              className="font-primary text-base"
            >
              Start Raiding
            </Button>
          </Link>
        </div>

        <div className="slider-section px-2 md:px-6 lg:px-8 mb-20 md:mb-24 lg:mb-32">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-12">
            {/* Slider Section */}
            <div className="w-full lg:w-2/5">
              <div className="relative">
                {isLoading || isScrapingData ? (
                  // Enhanced Loading skeleton with scraping progress
                  <div className="animate-pulse">
                    <div className="h-[200px] bg-gray-200 rounded-lg mb-4" />
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>

                    {/* Scraping Progress Indicator */}
                    {isScrapingData && (
                      <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-primary text-sm font-medium text-gray-800">
                            Fetching Surf Data
                          </h4>
                          <span className="text-xs font-primary text-gray-500">
                            {scrapingProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-[var(--color-tertiary)] h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${scrapingProgress}%` }}
                          ></div>
                        </div>
                        <p className="mt-2 text-xs font-primary text-gray-600">
                          {scrapingStatus}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {/* Previous Button - Made larger for mobile */}
                    <button
                      onClick={handlePrevious}
                      className="p-2 md:p-1 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
                    >
                      <svg
                        className="w-6 h-6 md:w-4 md:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {/* Cards Container - Adjusted spacing */}
                    <div className="flex-1 overflow-hidden mx-1 md:mx-2">
                      <div
                        className="flex gap-1 md:gap-2 transition-transform duration-300"
                        style={{
                          transform: `translateX(-${sliderIndex * (100 / cardsPerView)}%)`,
                        }}
                      >
                        {beaches.map((beach: Beach) => (
                          <div
                            key={beach.id}
                            className="flex-shrink-0"
                            style={{ width: `${100 / cardsPerView}%` }}
                          >
                            <button
                              onClick={() => setSelectedBeachId(beach.id)}
                              className={`w-full rounded-lg overflow-hidden transition-all duration-300
                                ${selectedBeachId === beach.id ? "bg-[var(--color-tertiary)]" : "bg-white/5 hover:bg-white/10"}
                                flex flex-col md:block`}
                            >
                              {/* Mobile button text - Improved centering */}
                              <div className="md:hidden p-3 text-center flex-1 flex flex-col justify-center">
                                <h3 className="font-primary text-sm font-medium text-white">
                                  {beach.name}
                                </h3>
                                <p className="font-primary text-xs text-gray-600">
                                  {beach.country?.name}
                                </p>
                              </div>

                              {/* Desktop image card */}
                              <div className="hidden md:block">
                                <div className="relative aspect-video max-w-[340px] rounded-md">
                                  {beach.image ? (
                                    <Image
                                      src={beach.image}
                                      alt={beach.name}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 340px) 100vw, 340px"
                                      quality={75}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-white">
                                        No image available
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-left p-1.5">
                                  <h3 className="font-primary text-white text-sm md:text-xs font-medium mb-0.5">
                                    {beach.name}
                                  </h3>
                                  <p className="font-primary text-xs md:text-[10px] text-[var(--color-text-secondary)]">
                                    {beach.country?.name}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Button - Made larger for mobile */}
                    <button
                      onClick={handleNext}
                      disabled={sliderIndex === maxIndex}
                      className="p-2 md:p-1 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
                    >
                      <svg
                        className="w-6 h-6 md:w-4 md:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="mt-4 md:mt-8 lg:mt-12 bg-white rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 shadow-sm border border-gray-100 max-w-[640px] mx-auto lg:mx-0">
                  <h3 className="font-primary text-[16pxx] font-medium mb-2 md:mb-4">
                    Optimal Conditions
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 min-h-[200px] md:min-h-[240px] lg:min-h-[320px]">
                    {/* Current Conditions */}
                    <div className="space-y-2">
                      <h4 className="font-primary text-sm text-gray-500 uppercase tracking-wide"></h4>
                      {isLoading ? (
                        // Skeleton loader for conditions
                        <div className="animate-pulse space-y-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="flex items-center gap-4 pb-2 border-b border-gray-200"
                            >
                              <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : currentBeachData && surfData?.[selectedBeachId] ? (
                        <ul className="space-y-0 divide-y divide-gray-100">
                          {getConditionReasons(
                            beaches.find(
                              (b: Beach) => b.id === selectedBeachId
                            )!,
                            surfData[selectedBeachId]!,
                            false
                          ).optimalConditions.map((condition, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-4 py-3"
                            >
                              <span className="inline-flex items-center justify-center w-4 h-4">
                                {condition.isMet ? (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4 text-[var(--color-tertiary)]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                  >
                                    <path
                                      d="M20 6L9 17L4 12"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4 text-[var(--color-text-secondary)]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                  >
                                    <path
                                      d="M18 6L6 18M6 6l12 12"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                              <span
                                className={`font-primary text-sm ${
                                  condition.isMet
                                    ? "text-gray-800"
                                    : "text-gray-500"
                                }`}
                              >
                                <span className="font-medium">
                                  {condition.text.split(":")[0]}:
                                </span>{" "}
                                <span className="font-normal">
                                  {condition.text.split(":")[1]}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-500 italic font-primary">
                          No data available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Image and content */}
            <div className="w-full lg:w-3/5 relative mt-6 lg:mt-0">
              {isLoading || isScrapingData ? (
                <div className="animate-pulse">
                  <div className="h-[240px] md:h-[400px] lg:h-[540px] bg-gray-200 rounded-2xl mb-4 md:mb-6" />
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4" />
                    <div className="h-20 bg-gray-200 rounded w-1/3" />
                  </div>

                  {/* Additional scraping details for larger screens */}
                  {isScrapingData && (
                    <div className="hidden md:block mt-6 bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-md border border-gray-200 max-w-md">
                      <h4 className="font-primary text-base font-medium text-gray-800 mb-4">
                        Surf Data Collection in Progress
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${scrapingProgress >= 25 ? "bg-[var(--color-tertiary)]" : "bg-gray-200"}`}
                          >
                            {scrapingProgress >= 25 && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-primary text-sm font-medium">
                              Fetching forecast data
                            </p>
                            <p className="font-primary text-xs text-gray-500">
                              Connecting to weather services
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${scrapingProgress >= 50 ? "bg-[var(--color-tertiary)]" : "bg-gray-200"}`}
                          >
                            {scrapingProgress >= 50 && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-primary text-sm font-medium">
                              Processing conditions
                            </p>
                            <p className="font-primary text-xs text-gray-500">
                              Analyzing wind and swell data
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${scrapingProgress >= 75 ? "bg-[var(--color-tertiary)]" : "bg-gray-200"}`}
                          >
                            {scrapingProgress >= 75 && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-primary text-sm font-medium">
                              Calculating surf quality
                            </p>
                            <p className="font-primary text-xs text-gray-500">
                              Determining optimal conditions
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${scrapingProgress >= 100 ? "bg-[var(--color-tertiary)]" : "bg-gray-200"}`}
                          >
                            {scrapingProgress >= 100 && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-primary text-sm font-medium">
                              Finalizing results
                            </p>
                            <p className="font-primary text-xs text-gray-500">
                              Preparing surf recommendations
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-[240px] md:h-[400px] lg:h-[540px] mb-4 md:mb-6 rounded-2xl overflow-hidden">
                  {selectedBeachId && surfData?.[selectedBeachId] && (
                    <>
                      <div className="absolute inset-0">
                        <Image
                          ref={imageRef}
                          src={currentBeach?.image || "/fallback-surf.jpg"}
                          alt={currentBeach?.name || "Surf spot"}
                          fill
                          sizes="(max-width: 900px) 20vw, 80vw"
                          className="object-cover"
                          priority
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
                        />
                      </div>

                      <div className="absolute bottom-3 md:bottom-4 lg:bottom-5 left-3 md:left-4 lg:left-6 right-3 md:right-4 lg:right-6">
                        <div className="flex flex-col gap-2 md:gap-4 lg:gap-6">
                          <div className="w-full md:w-2/3 lg:w-1/2">
                            {selectedBeachId && surfData?.[selectedBeachId] && (
                              <div className="bg-black/30 backdrop-blur-md p-2 md:p-3 lg:p-4 rounded-xl border border-white/20">
                                <div className="gap-2 md:gap-3 mb-1 md:mb-2 lg:mb-3 flex items-center">
                                  <span className="text-xs md:text-sm lg:text-base font-medium text-white font-primary">
                                    Today's Rating
                                  </span>
                                  <span className="text-base md:text-lg bg-[var(--color-tertiary)] px-2 py-0.5 rounded-lg shadow-sm">
                                    {(() => {
                                      const score =
                                        getBeachScore(selectedBeachId);
                                      const display = score
                                        ? getScoreDisplay(score.score)
                                        : null;
                                      const conditions =
                                        surfData?.[selectedBeachId];

                                      return display?.emoji;
                                    })()}
                                  </span>
                                </div>
                                <p className="text-xs md:text-sm mb-3 md:mb-4 text-white/80">
                                  <span className="bg-black/40 px-2 py-1 rounded-md inline-block">
                                    {(() => {
                                      const score =
                                        getBeachScore(selectedBeachId);
                                      const display = score
                                        ? getScoreDisplay(score.score)
                                        : null;

                                      // Replace description with star rating
                                      return display?.stars || "⭐";
                                    })()}
                                  </span>
                                </p>
                                <div className="space-y-1.5 md:space-y-3 text-[10px] md:text-xs bg-black/20 rounded-md p-3 md:p-4">
                                  <p className="flex items-center gap-2 text-white/90 font-primary pb-1.5 border-b border-white/10">
                                    <span
                                      className="inline-flex"
                                      title={`Wind Speed: ${surfData?.[selectedBeachId]?.windSpeed < 5 ? "Light" : surfData?.[selectedBeachId]?.windSpeed < 12 ? "Moderate" : surfData?.[selectedBeachId]?.windSpeed < 20 ? "Strong" : "Very Strong"}`}
                                    >
                                      {getWindEmoji(
                                        surfData?.[selectedBeachId]?.windSpeed
                                      )}
                                    </span>
                                    <span className="font-medium font-primary">
                                      {degreesToCardinal(
                                        surfData?.[selectedBeachId]
                                          ?.windDirection
                                      )}{" "}
                                      @ {surfData?.[selectedBeachId]?.windSpeed}
                                      kts
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-2 text-white/90 font-primary py-1.5 border-b border-white/10">
                                    <span
                                      className="inline-flex font-primary"
                                      title={`Swell Height: ${surfData?.[selectedBeachId]?.swellHeight < 0.5 ? "Flat" : surfData?.[selectedBeachId]?.swellHeight < 1 ? "Small" : surfData?.[selectedBeachId]?.swellHeight < 2 ? "Medium" : "Large"}`}
                                    >
                                      {getSwellEmoji(
                                        surfData?.[selectedBeachId]?.swellHeight
                                      )}
                                    </span>
                                    <span className="font-medium font-primary">
                                      {surfData?.[selectedBeachId]?.swellHeight}
                                      m @{" "}
                                      {surfData?.[selectedBeachId]?.swellPeriod}
                                      s
                                    </span>
                                  </p>
                                  <p className="flex items-center gap-2 text-white/90 font-primary pt-1.5">
                                    <span
                                      className="inline-flex font-primary"
                                      title={`Swell Direction: ${surfData?.[selectedBeachId]?.swellDirection}`}
                                    >
                                      {getDirectionEmoji(
                                        surfData?.[selectedBeachId]
                                          ?.swellDirection || 0
                                      )}
                                    </span>
                                    <span className="font-medium font-primary">
                                      {
                                        surfData?.[selectedBeachId]
                                          ?.swellDirection
                                      }
                                      °
                                    </span>
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts Feature Promotion with improved alignment */}
        <div className="mb-16 md:mb-20 lg:mb-24 bg-gradient-to-r from-[var(--color-tertiary-light)] to-[var(--color-tertiary)] rounded-xl p-8 md:p-10 lg:p-12 border-b border-gray-400">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
            <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center md:justify-start order-2 md:order-1 mt-8 md:mt-0">
              <div
                className="relative w-[220px] h-[280px] md:w-[280px] md:h-[320px]"
                ref={alertCardRef}
              >
                {/* Alert Card Animation */}
                <div className="absolute inset-0 bg-white rounded-lg border border-gray-100 overflow-hidden transform">
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-primary text-sm font-medium">
                        Jeffreys Bay Alert
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-4 bg-[var(--color-tertiary)] rounded-full"></div>
                        <Bell className="w-4 h-4 text-[var(--color-alert-icon-rating)] fill-[var(--color-alert-icon-rating)] bell-icon" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs font-primary">
                        <p className="text-gray-700 font-medium mb-2">
                          Reference Conditions:
                        </p>
                        <div className="bg-gray-50 p-2 rounded-lg space-y-3">
                          {/* Wind Speed with Range */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-2">
                              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-primary">
                                <span className="mr-1">💨</span>
                                <span className="font-medium">Wind Speed</span>
                              </div>
                              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-primary">
                                <span>12kts</span>
                              </div>
                              <div className="inline-flex items-center bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-primary cursor-help">
                                <span className="font-medium">±3kts</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-500 font-primary">
                              <span className="font-medium">Range:</span> 9 -
                              15kts
                            </div>
                          </div>

                          {/* Swell Height with Range */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-2">
                              <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-primary">
                                <span className="mr-1">🌊</span>
                                <span className="font-medium">
                                  Swell Height
                                </span>
                              </div>
                              <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-primary">
                                <span>1.5m</span>
                              </div>
                              <div className="inline-flex items-center bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-primary cursor-help">
                                <span className="font-medium">±0.5m</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-500 font-primary">
                              <span className="font-medium">Range:</span> 1.0 -
                              2.0m
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col items-start justify-center order-1 md:order-2">
              <h3 className="font-primary text-xl md:text-2xl lg:text-3xl font-semibold mb-2 text-black flex items-center gap-2">
                <Bell
                  ref={bellIconRef}
                  className="w-5 h-5 text-[var(--color-tertiary-dark)] fill-transparent"
                />
                Get alerted to great conditions
              </h3>
              <p className="font-primary text-sm md:text-base mb-6 max-w-[540px] font-normal">
                Get notified when your favourite spots are firing. Set up custom
                alerts based on swell size, wind direction, star ratings and
                more.
              </p>
              <Link href="/alerts">
                <Button
                  variant="default"
                  size="default"
                  className="font-primary text-base"
                >
                  Set Up Alerts
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Log Book Feature Promotion with improved alignment */}
        <div className="bg-gradient-to-r from-[var(--color-secondary-light)] to-[var(--color-secondary)] rounded-xl p-8 md:p-10 lg:p-12 border-b border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
            <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center md:justify-start order-2 md:order-1 mt-8 md:mt-0">
              <div
                className="relative w-[220px] h-[280px] md:w-[280px] md:h-[320px]"
                ref={logCardRef}
              >
                {/* Log Card Animation */}
                <div className="absolute inset-0 bg-white rounded-lg border border-gray-100 overflow-hidden transform">
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-primary text-sm font-medium">
                        Surf Session Log
                      </h4>
                      <div className="flex items-center gap-1 star-icons">
                        {[1, 2, 3, 4].map((i) => (
                          <Star
                            key={i}
                            className="w-3 h-3 fill-[var(--color-alert-icon-rating)] text-[var(--color-alert-icon-rating)]"
                          />
                        ))}
                        <Star className="w-3 h-3 text-gray-300" />
                      </div>
                    </div>
                    <div className="space-y-3 text-xs font-primary">
                      <p>📍 Muizenberg, South Africa</p>
                      <p>📆 June 15, 2023</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-primary">
                          <span>SW @ 8kts</span>
                        </div>
                        <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-primary">
                          <span>1.2m @ 10s</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="font-medium mb-1">Notes:</p>
                        <p className="text-gray-600 text-[11px] line-clamp-2">
                          Great session with clean waves. Used my 6'2"
                          shortboard. Caught about 10 waves and practiced
                          cutbacks.
                        </p>
                      </div>
                      <div className="h-16 bg-gray-100 rounded-md mt-2 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col items-start justify-center order-1 md:order-2">
              <h3 className="font-primary text-xl md:text-2xl lg:text-3xl font-semibold mb-2 text-black flex items-center gap-2">
                <svg
                  ref={bookIconRef}
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[var(--color-secondary-dark)]"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
                Track your surf journey
              </h3>
              <p className="font-primary text-sm md:text-base mb-6 max-w-[540px] font-normal text-black/90">
                Keep a digital record of your surf sessions. Log wave quality,
                board performance, and personal achievements to improve your
                surfing.
              </p>
              <Link href="/raidlogs">
                <Button
                  variant="default"
                  size="default"
                  className="font-primary text-base"
                >
                  Start Your Log Book
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
