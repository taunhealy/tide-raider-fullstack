import { cn } from "@/app/lib/utils";
import type { Region } from "@/app/types/beaches";

interface RegionFilterButtonProps {
  region: Region;
  isSelected: boolean;
  isLoading?: boolean;
  onClick: () => void;
  count: number;
}

export default function RegionFilterButton({
  region,
  isSelected,
  isLoading,
  onClick,
  count,
}: RegionFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "px-3 py-1.5 text-sm rounded-full",
        "bg-white border border-gray-200",
        "hover:bg-gray-50 transition-colors",
        "font-primary text-[var(--color-text-primary)]",
        "flex items-center gap-2",
        "relative",
        isLoading && "cursor-wait opacity-70",
        isSelected &&
          "bg-[var(--color-bg-tertiary)] text-white border-transparent"
      )}
    >
      <span className="relative z-10">{region.name}</span>
      {count > 0 && (
        <span
          className={cn(
            "text-xs px-1.5 rounded-full",
            isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
          )}
        >
          {count}
        </span>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-t-transparent border-[var(--color-tertiary)] rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
}
