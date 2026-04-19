"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/app/lib/utils";

interface DateOption {
  label: string;
  date: Date;
  value: string; // ISO date string YYYY-MM-DD
}

interface DateSelectorProps {
  selectedDate: string | null; // ISO date string YYYY-MM-DD
  onDateSelect: (date: string) => void;
  className?: string;
  beaches?: any[];
  availableDates?: string[];
}

export default function DateSelector({
  selectedDate,
  onDateSelect,
  className,
  beaches = [],
  availableDates = []
}: DateSelectorProps) {
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate date options from availableDates list
  const dateOptions = useMemo(() => {
    if (!mounted || availableDates.length === 0) return [];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    return availableDates.map((dateStr) => {
      const date = new Date(dateStr);
      
      // Calculate how many beaches have a rating >= 3 for this day
      const scoreCount = beaches.reduce((acc, b: any) => {
        const rating = b.dailyScores?.[dateStr]?.rating ?? b.rating;
        return rating >= 3 ? acc + 1 : acc;
      }, 0);

      let label: string;
      if (dateStr === todayStr) label = "Today";
      else if (dateStr === tomorrowStr) label = "Tomorrow";
      else {
        label = date.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        });
      }

      const subLabel = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });

      return {
        label,
        date,
        value: dateStr,
        scoreCount,
        subLabel
      } as any;
    });
  }, [mounted, beaches, availableDates]);

  const activeDate = selectedDate || dateOptions[0]?.value || null;

  if (!mounted || dateOptions.length === 0) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-12 w-20 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200 shadow-sm", className)}>
      {dateOptions.map((option: any) => {
        const isSelected = activeDate === option.value;
        return (
            <button
              key={option.value}
              onClick={() => onDateSelect(option.value)}
              className={cn(
                "flex flex-col items-center min-w-[75px] px-3 py-2 rounded-xl transition-all relative group",
                isSelected
                  ? "bg-shimmer-dark text-[#3b82f6] shadow-xl scale-105 z-10"
                  : "text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm"
              )}
            >
            <span className="text-[10px] font-black uppercase tracking-tighter">
              {option.label}
            </span>
            <span className={cn(
              "text-[9px] font-bold",
              isSelected ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500"
            )}>
              {option.subLabel}
            </span>
            
            {option.scoreCount > 0 && (
              <div className={cn(
                "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border-2",
                isSelected 
                  ? "bg-white text-gray-900 border-gray-900 shadow-sm" 
                  : "bg-blue-600 text-white border-white shadow-sm"
              )}>
                {option.scoreCount}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
