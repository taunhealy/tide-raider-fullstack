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
    <div className="flex items-center gap-3 bg-gray-50/50 backdrop-blur-sm border border-gray-200 px-4 h-10 rounded-xl shadow-sm transition-all hover:bg-white">
      <span 
        className={cn(
          "text-[10px] font-black uppercase tracking-widest transition-colors duration-300", 
          !isPrivate ? "text-brand-3" : "text-gray-400"
        )}
      >
        Public
      </span>
      
      <Switch 
        checked={isPrivate} 
        onCheckedChange={onChange}
        className={cn(
          "transition-all",
          isPrivate ? "bg-indigo-600" : "bg-brand-3"
        )}
      />
      
      <span 
        className={cn(
          "text-[10px] font-black uppercase tracking-widest transition-colors duration-300", 
          isPrivate ? "text-indigo-600" : "text-gray-400"
        )}
      >
        Private
      </span>
    </div>
  );
}
