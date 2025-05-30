import React from "react";
import { cn } from "@/app/lib/utils";
import { Badge } from "@/app/components/ui/badge";

type FilterVariant =
  | "continent"
  | "country"
  | "region"
  | "waveType"
  | "difficulty";

interface FilterButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  variant?: FilterVariant;
  count?: number;
  isLoading?: boolean;
  className?: string;
}

export function FilterButton({
  label,
  isSelected,
  onClick,
  variant = "region",
  count,
  isLoading = false,
  className,
}: FilterButtonProps) {
  const variantStyles = {
    continent: "px-4 py-2 rounded-full text-sm",
    country: "px-3 py-1.5 rounded-md text-xs",
    region: "px-3 py-1.5 rounded-md text-xs",
    waveType: "px-3 py-1.5 rounded-md text-xs",
    difficulty: "px-3 py-1.5 rounded-md text-xs",
  };

  const variantColors = {
    continent: isSelected
      ? "bg-blue-600 text-white"
      : "bg-gray-100 hover:bg-gray-200 text-gray-800",
    country: isSelected
      ? "bg-green-50 border-green-200 text-green-800"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
    region: isSelected
      ? "bg-cyan-50 border-cyan-200 text-cyan-800"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
    waveType: isSelected
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
    difficulty: isSelected
      ? "bg-purple-50 border-purple-200 text-purple-800"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "font-medium transition-colors border flex items-center justify-between gap-2 font-primary",
        variantStyles[variant],
        variantColors[variant],
        className
      )}
    >
      <span>{label}</span>

      {isLoading && count === undefined ? (
        <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse"></div>
      ) : count && count > 0 ? (
        <Badge
          variant="default"
          className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
        >
          {count}
        </Badge>
      ) : null}
    </button>
  );
}
