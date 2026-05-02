"use client";

import { Button } from "./ui/Button";
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
    <Button
      onClick={onChange}
      variant={isPrivate ? "outline" : "action"}
      size="sm"
      className={cn(
        "inline-flex h-10 px-5 border-gray-200 transition-all font-bold uppercase tracking-widest text-[11px] rounded-xl shadow-sm active:scale-95",
        !isPrivate && "bg-brand-3 text-gray-900 border-none shadow-[0_0_15px_rgba(28,217,255,0.3)] hover:bg-white"
      )}
    >
      {isPrivate ? "Private" : "Public"}
    </Button>
  );
}
