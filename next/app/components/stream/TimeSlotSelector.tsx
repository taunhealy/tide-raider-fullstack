"use client";

import React from "react";
import { TimeSlot } from "@/app/types/forecast";
import { cn } from "@/app/lib/utils";

interface TimeSlotSelectorProps {
  selectedSlot: TimeSlot;
  onChange: (slot: TimeSlot) => void;
  activeSlot: TimeSlot;
  orientation?: "vertical" | "horizontal";
  isLoading?: boolean;
}

export default function TimeSlotSelector({
  selectedSlot,
  onChange,
  activeSlot,
  orientation = "horizontal",
  isLoading = false,
}: TimeSlotSelectorProps) {
  const slots = [
    { id: TimeSlot.MORNING, label: "06:00", name: "MORNING" },
    { id: TimeSlot.NOON, label: "12:00", name: "NOON" },
    { id: TimeSlot.EVENING, label: "18:00", name: "EVENING" },
  ];

  const isVertical = orientation === "vertical";

  return (
    <div 
      suppressHydrationWarning
      className={cn(
        "flex gap-2 p-1.5 rounded-2xl relative z-[100] shadow-sm transition-all duration-300",
        isVertical 
          ? "flex-col bg-black/60 backdrop-blur-xl border border-white/10" 
          : "flex-row bg-white/50 backdrop-blur-sm border border-gray-200"
      )}
    >
      {isLoading ? (
        slots.map((slot) => (
          <div
            key={slot.id}
            suppressHydrationWarning
            className={cn(
              "animate-pulse bg-gray-200/50 rounded-lg",
              isVertical ? "w-16 h-20" : "w-16 sm:w-20 h-10"
            )}
          />
        ))
      ) : (
        slots.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          
          return (
            <button
              key={slot.id}
              onClick={() => onChange(slot.id)}
              suppressHydrationWarning
              className={cn(
                "relative flex flex-col items-center justify-center transition-all duration-300 group rounded-lg overflow-hidden",
                isVertical ? "w-16 h-20" : "w-16 sm:w-20 h-10",
                isSelected 
                  ? (isVertical ? "bg-white/10 border border-white/20" : "bg-white border border-black/10 shadow-sm scale-[1.02]")
                  : (isVertical ? "border border-white/5 hover:bg-white/5" : "hover:bg-white/50 border border-transparent")
              )}
            >
              {/* Selection indicator bar */}
              {isSelected && (
                <div 
                  className={cn(
                    "absolute bg-brand-3",
                    isVertical ? "left-0 top-0 bottom-0 w-1 bg-white" : "bottom-0 left-0 right-0 h-1"
                  )} 
                />
              )}

              <div className="flex flex-col items-center gap-0.5">
                <span className={cn(
                  "font-black uppercase tracking-[0.2em] transition-colors",
                  isVertical ? "text-[8px]" : "text-[7px]",
                  isSelected 
                    ? (isVertical ? "text-white" : "text-brand-3") 
                    : (isVertical ? "text-white/30 group-hover:text-white/50" : "text-gray-400 group-hover:text-gray-600")
                )}>
                  {slot.name}
                </span>
                
                <span className={cn(
                  "font-black tabular-nums transition-colors",
                  isVertical ? "text-[13px] font-mono" : "text-[11px]",
                  isSelected 
                    ? (isVertical ? "text-white" : "text-black") 
                    : (isVertical ? "text-white/20 group-hover:text-white/40" : "text-gray-400 group-hover:text-gray-500")
                )}>
                  {slot.label}
                </span>
              </div>

              {/* Hover Tooltip/Label */}
              <div 
                className={cn(
                  "absolute px-2 py-1 bg-black text-white text-[8px] font-bold uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-[110] shadow-lg",
                  isVertical ? "left-full ml-4 top-1/2 -translate-y-1/2" : "bottom-full mb-3 left-1/2 -translate-x-1/2"
                )}
              >
                {slot.name} Sector
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
