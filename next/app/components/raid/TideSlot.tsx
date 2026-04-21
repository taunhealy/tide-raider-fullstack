"use client";

import React from "react";
import { Waves, TrendingUp, TrendingDown, Circle } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

interface TideSlotProps {
  tide?: string;
}

const TideSlot: React.FC<TideSlotProps> = ({ tide }) => {

  const isRising = tide?.toLowerCase().includes("rising");
  const isFalling = tide?.toLowerCase().includes("falling");

  return (
    <div className="flex gap-2 p-1.5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 ring-1 ring-white/5 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-left-4">
      <div className="w-16 sm:w-20 h-10 bg-black/90 border p-5 border-white/10 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group shadow-xl">
        {/* Selection indicator bar */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-500",
          isRising ? "bg-emerald-500" : isFalling ? "bg-amber-500" : "bg-blue-500/50"
        )} />
        
        <div className="flex flex-col items-center gap-0">
        
          
          <div className="flex items-center gap-2">
            {isRising && <TrendingUp className="w-3 h-3 gap-2 text-emerald-400" />}
            {isFalling && <TrendingDown className="w-3 h-3 text-amber-400" />}
            {!isRising && !isFalling && !tide && <LoadingSpinner size="sm" />}
            {!isRising && !isFalling && tide && <Circle className="w-3 h-3 text-white/40" />}
            <span className="font-regular text-[10px] text-white tracking-tighter">
              {tide}
            </span>
          </div>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />

        {/* Hover Tooltip */}
        <div className="absolute px-2 py-4 bg-black/50 text-white text-[8px] font-regular tracking-widest rounded-md border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-[110] shadow-2xl bottom-full mb-3 left-1/2 -translate-x-1/2 backdrop-blur-md">
          Current Trend: {tide || "No Data Available"}
        </div>
      </div>
    </div>
  );
};

export default TideSlot;
