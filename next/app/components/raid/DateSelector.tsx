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
}

export default function DateSelector({
  selectedDate,
  onDateSelect,
  className,
}: DateSelectorProps) {
  const [mounted, setMounted] = useState(false);

  // Generate date options (Today, Tomorrow, Day After, etc.)
  // Only calculate on client to avoid hydration mismatches
  const dateOptions = useMemo(() => {
    if (!mounted) {
      // Return empty array during SSR to prevent hydration mismatch
      return [];
    }

    const options: DateOption[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Generate up to 7 days of options
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      let label: string;
      if (i === 0) {
        label = "Today";
      } else if (i === 1) {
        label = "Tomorrow";
      } else {
        // Format as "Mon, Nov 18" or "Wed, Nov 20"
        // Use UTC methods to ensure consistency
        const dayName = date.toLocaleDateString("en-US", {
          weekday: "short",
          timeZone: "UTC",
        });
        const monthName = date.toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
        });
        const day = date.getUTCDate();
        label = `${dayName}, ${monthName} ${day}`;
      }

      options.push({
        label,
        date,
        value: dateStr,
      });
    }

    return options;
  }, [mounted]);

  // Set mounted to true after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to today if no date selected
  const activeDate = selectedDate || dateOptions[0]?.value || null;

  // Show placeholder during SSR to prevent layout shift
  if (!mounted || dateOptions.length === 0) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border border-gray-200 bg-white animate-pulse",
              i === 1 && "w-[60px]",
              i === 2 && "w-[80px]",
              i > 2 && "w-[100px]"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {dateOptions.map((option) => {
        const isSelected = activeDate === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onDateSelect(option.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full",
              "border border-gray-200",
              "font-primary transition-colors",
              "flex items-center gap-2",
              isSelected
                ? "bg-[var(--color-bg-tertiary)] text-white border-transparent"
                : "bg-white hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
