"use client";

import React from "react";
import { TimeSlot } from "@/app/types/forecast";
import { cn } from "@/app/lib/utils";

interface TimeSlotSelectorProps {
  selectedSlot: TimeSlot;
  onChange: (slot: TimeSlot) => void;
  activeSlot: TimeSlot;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  selectedSlot,
  onChange,
  activeSlot,
}) => {
  const slots = [
    { id: TimeSlot.MORNING, label: "06:00", name: "MORNING" },
    { id: TimeSlot.NOON, label: "12:00", name: "NOON" },
    { id: TimeSlot.EVENING, label: "18:00", name: "EVENING" },
  ];

  return (
    <div className="flex flex-col gap-3 p-1.5 ml-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl relative z-[100]">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.id;
        const isActive = activeSlot === slot.id;

        return (
          <button
            key={slot.id}
            onClick={() => onChange(slot.id)}
            className={cn(
              "relative flex flex-col items-center justify-center w-16 h-20 transition-all duration-300 group rounded-lg overflow-hidden",
              isSelected 
                ? "bg-white/10 border border-white/20" 
                : "border border-white/5 hover:bg-white/5"
            )}
          >
            {/* Selection indicator bar (Professional White) */}
            {isSelected && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
            )}

            <div className="flex flex-col items-center gap-1">
              <span className={cn(
                "text-[8px] font-black uppercase tracking-[0.25em] transition-colors",
                isSelected ? "text-white" : "text-white/30 group-hover:text-white/50"
              )}>
                {slot.name}
              </span>
              
              <span className={cn(
                "text-[13px] font-black tabular-nums font-mono transition-colors",
                isSelected ? "text-white" : "text-white/20 group-hover:text-white/40"
              )}>
                {slot.label}
              </span>
            </div>

            {/* Sector Label on Hover - Professional Badge */}
            <div className="absolute left-full ml-6 px-3 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-[100] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              Sector: {slot.name}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TimeSlotSelector;
