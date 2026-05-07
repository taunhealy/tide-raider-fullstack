"use client";

import { Switch } from "./ui/switch";
import { cn } from "@/app/lib/utils";

interface LogVisibilityToggleProps {
  isPrivate: boolean;
  onChange: () => void;
}

export function LogVisibilityToggle({
  isPrivate,
  onChange,
}: LogVisibilityToggleProps) {
  return (
    <div className="flex items-center gap-5 bg-white/50 backdrop-blur-sm border border-gray-200 px-4 h-10 rounded-xl shadow-sm transition-all hover:bg-white">
      <span 
        className={cn(
          "text-[10px] font-black uppercase tracking-widest transition-colors duration-300", 
          !isPrivate ? "text-slate-900" : "text-gray-400"
        )}
      >
        Public
      </span>
      
      <Switch 
        checked={isPrivate} 
        onCheckedChange={onChange}
        className={cn(
          "transition-all data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-900"
        )}
      />
      
      <span 
        className={cn(
          "text-[10px] font-black uppercase tracking-widest transition-colors duration-300", 
          isPrivate ? "text-slate-900" : "text-gray-400"
        )}
      >
        Private
      </span>
    </div>
  );
}
