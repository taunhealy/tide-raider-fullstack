"use client";

import { useState, useMemo } from "react";
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
  // Generate date options (Today, Tomorrow, Day After, etc.)
  const dateOptions = useMemo(() => {
    const options: DateOption[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Generate up to 7 days of options
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      let label: string;
      if (i === 0) {
        label = "Today";
      } else if (i === 1) {
        label = "Tomorrow";
      } else {
        // Format as "Mon, Nov 18" or "Wed, Nov 20"
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const monthName = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        label = `${dayName}, ${monthName} ${day}`;
      }

      options.push({
        label,
        date,
        value: dateStr,
      });
    }

    return options;
  }, []);

  // Default to today if no date selected
  const activeDate = selectedDate || dateOptions[0]?.value || null;

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
