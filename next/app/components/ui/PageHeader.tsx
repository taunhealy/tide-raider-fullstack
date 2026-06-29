import { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  badge,
  icon,
  rightElement,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-20", className)}>
      <div className="space-y-1">
        {(badge || icon) && (
          <div className="flex items-center gap-2 mb-2">
            {icon && (
              <div className="w-8 h-8 rounded-xl brand-icon-wrapper flex items-center justify-center">
                {icon}
              </div>
            )}
            {badge && (
              <span className="text-[10px] font-black text-brand-gray uppercase tracking-[0.2em]">
                {badge}
              </span>
            )}
          </div>
        )}
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-gray-500 font-medium mt-1 max-w-md leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {rightElement && (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {rightElement}
        </div>
      )}
    </div>
  );
}
