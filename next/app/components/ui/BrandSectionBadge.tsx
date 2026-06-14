import React, { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

interface BrandSectionBadgeProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function BrandSectionBadge({ icon, children, className }: BrandSectionBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-brand-blue-muted/40 text-slate-600 text-[10px] font-black uppercase tracking-widest",
      className
    )}>
      {icon}
      {children}
    </div>
  );
}
