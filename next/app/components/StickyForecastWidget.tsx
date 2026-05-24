// app/components/StickyForecastWidget.tsx
"use client";

import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";
import { useEffect, useRef, useState, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { Waves, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/app/lib/utils";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StickyForecastWidgetProps {
  availableDates?: string[];
  forecast?: any;
  beaches?: any[];
  isLoading?: boolean;
}

export default function StickyForecastWidget({
  availableDates = [],
  forecast,
  beaches = [],
  isLoading = false,
}: StickyForecastWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const { 
    filters: { regionId, region: regionName, forecastDate, timeSlot },
    updateFilter
  } = useBeachFilters();

  const normalizedDate = forecastDate || new Date().toISOString().split("T")[0];
  const normalizedTimeSlot = timeSlot || "MORNING";

  useEffect(() => {
    if (!widgetRef.current) return;

    // Create the animation
    const anim = gsap.to(widgetRef.current, {
      yPercent: 120, // Slide all the way down
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

  // Generate date options from availableDates list
  const dateOptions = useMemo(() => {
    if (availableDates.length === 0) return [];

    // Timezone-safe local today calculation
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowYear = tomorrow.getFullYear();
    const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const tomorrowDay = String(tomorrow.getDate()).padStart(2, "0");
    const tomorrowStr = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;

    const futureOrTodayDates = availableDates.filter((dateStr) => dateStr >= todayStr);

    return futureOrTodayDates.slice(0, 3).map((dateStr) => {
      const date = new Date(dateStr);
      const isValidDate = !isNaN(date.getTime());
      
      let label: string = "N/A";
      if (dateStr === todayStr) label = "Today";
      else if (dateStr === tomorrowStr) label = "Tomorrow";
      else if (isValidDate) {
        label = date.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        });
      }

      const subLabel = isValidDate ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }) : "Invalid";

      return {
        label,
        date,
        value: dateStr,
        subLabel,
        isToday: dateStr === todayStr
      };
    });
  }, [availableDates]);

  const slots = [
    { id: "MORNING", label: "06:00", name: "MORNING" },
    { id: "NOON", label: "12:00", name: "NOON" },
    { id: "EVENING", label: "18:00", name: "EVENING" },
  ];

  const tideIsRising = forecast?.tide?.toLowerCase().includes("rising");
  const tideIsFalling = forecast?.tide?.toLowerCase().includes("falling");

  if (!regionId) return null;

  return (
    <div
      ref={widgetRef}
      className="hidden md:flex fixed bottom-[60px] left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-3rem)] max-w-6xl items-center justify-between bg-white/95 backdrop-blur-md py-2 px-4 rounded-xl border border-gray-200/60 shadow-[0_10px_35px_rgba(0,0,0,0.1)] transition-all"
    >
      <div className="flex flex-row items-center justify-between gap-4 w-full">
        {/* Left Section: Region and Tide Info */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col gap-0.5 min-w-[110px]">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
              Active Region
            </span>
            <span className="text-[11px] font-bold text-black font-secondary leading-tight truncate max-w-[130px]">
              {regionName || "Western Cape"}
            </span>
          </div>

          {/* Tide Info */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
              Tide
            </span>
            <div className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold font-primary border transition-colors w-fit",
              tideIsRising ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
              tideIsFalling ? "bg-amber-50 border-amber-100 text-amber-700" :
              "bg-blue-50 border-blue-100 text-blue-700"
            )}>
              {tideIsRising && <TrendingUp className="w-2 h-2 text-emerald-500" />}
              {tideIsFalling && <TrendingDown className="w-2 h-2 text-amber-500" />}
              {!tideIsRising && !tideIsFalling && <Waves className="w-2 h-2 text-blue-500" />}
              <span>{forecast?.tide || "No Data"}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200/80" />
        </div>

        {/* Middle Section: Date & Time Selector */}
        <div className="flex items-center gap-4 justify-center flex-1">
          {/* Date Selector */}
          {dateOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 hidden xl:inline shrink-0">
                Date
              </span>
              <div className="flex gap-0.5 p-0.5 bg-gray-50/80 rounded-lg border border-gray-200/50">
                {dateOptions.map((option) => {
                  const isSelected = normalizedDate === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => updateFilter("forecastDate", option.value)}
                      suppressHydrationWarning={true}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-[46px] px-1 py-0.5 transition-all relative rounded-md border text-center",
                        isSelected
                          ? "bg-white border-black/10 shadow-sm z-10"
                          : "text-gray-500 hover:bg-white/50 border-transparent",
                        option.isToday && !isSelected && "border-slate-200 bg-slate-100/40"
                      )}
                    >
                      <span className={cn(
                        "font-black uppercase tracking-[0.1em] text-[6px] leading-none",
                        isSelected ? "text-brand-3" : "text-gray-400"
                      )}>
                        {option.label}
                      </span>
                      <span className={cn(
                        "font-black text-[8px] tracking-tight leading-none mt-0.5",
                        isSelected ? "text-black" : "text-gray-400"
                      )}>
                        {option.subLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 hidden xl:inline shrink-0">
              Sector
            </span>
            <div className="flex gap-0.5 p-0.5 bg-gray-50/80 rounded-lg border border-gray-200/50">
              {slots.map((slot) => {
                const isSelected = normalizedTimeSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => updateFilter("timeSlot", slot.id)}
                    suppressHydrationWarning={true}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[46px] py-0.5 transition-all relative rounded-md border text-center",
                      isSelected
                        ? "bg-white border-black/10 shadow-sm z-10"
                        : "text-gray-500 hover:bg-white/50 border-transparent"
                    )}
                  >
                    <span className={cn(
                      "font-black uppercase tracking-[0.1em] text-[6px] leading-none",
                      isSelected ? "text-brand-3" : "text-gray-400"
                    )}>
                      {slot.name}
                    </span>
                    <span className={cn(
                      "font-black text-[8px] tracking-tight leading-none mt-0.5",
                      isSelected ? "text-black" : "text-gray-400"
                    )}>
                      {slot.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-gray-200/80 shrink-0" />

        {/* Right Section: Compact Forecast Capsules */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Wind capsule */}
          <div className="flex items-center gap-1.5 bg-blue-50/40 border border-blue-100/40 px-2 py-0.5 rounded-lg min-w-[70px]">
            <span className="text-[10px]">{getWindEmoji(forecast?.windSpeed ?? 0)}</span>
            <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase tracking-wider text-gray-400 leading-none">Wind</span>
              <span className="text-[9px] font-bold text-blue-900 font-primary leading-none mt-0.5">
                {forecast?.windSpeed ?? 0} kt
              </span>
            </div>
          </div>
          
          {/* Wind Direction capsule */}
          <div className="flex items-center gap-1.5 bg-blue-50/40 border border-blue-100/40 px-2 py-0.5 rounded-lg min-w-[70px]">
            <span className="text-[10px]">🧭</span>
            <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase tracking-wider text-gray-400 leading-none">Dir</span>
              <span className="text-[9px] font-bold text-blue-900 font-primary leading-none mt-0.5">
                {degreesToCardinal(forecast?.windDirection ?? 0)}
              </span>
            </div>
          </div>

          {/* Swell capsule */}
          <div className="flex items-center gap-1.5 bg-indigo-50/40 border border-indigo-100/40 px-2 py-0.5 rounded-lg min-w-[70px]">
            <span className="text-[10px]">{getSwellEmoji(forecast?.swellHeight ?? 0)}</span>
            <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase tracking-wider text-gray-400 leading-none">Swell</span>
              <span className="text-[9px] font-bold text-indigo-900 font-primary leading-none mt-0.5">
                {forecast?.swellHeight ?? 0}m
              </span>
            </div>
          </div>

          {/* Period capsule */}
          <div className="flex items-center gap-1.5 bg-indigo-50/40 border border-indigo-100/40 px-2 py-0.5 rounded-lg min-w-[60px]">
            <span className="text-[10px]">⏱️</span>
            <div className="flex flex-col">
              <span className="text-[6px] font-black uppercase tracking-wider text-gray-400 leading-none">Sec</span>
              <span className="text-[9px] font-bold text-indigo-900 font-primary leading-none mt-0.5">
                {forecast?.swellPeriod ?? 0}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
