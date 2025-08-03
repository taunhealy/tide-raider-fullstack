import { cn } from "@/app/lib/utils";
import type { Region } from "@/app/types/beaches";

interface RegionFilterButtonProps {
  region: Region;
  isSelected: boolean;
  isLoading?: boolean;
  onClick: (region: Region) => void;
  count: number;
}

export default function RegionFilterButton({
  region,
  isSelected,
  isLoading,
  onClick,
  count,
}: RegionFilterButtonProps) {
  console.log(
    "RegionFilterButton render:",
    region.id,
    region.name,
    "count:",
    count
  );

  return (
    <button
      onClick={() => {
        console.log("Button clicked for region:", region);
        onClick(region);
      }}
      disabled={isLoading}
      className={cn(
        "px-3 py-1.5 text-sm rounded-full",
        "bg-white border border-gray-200",
        "hover:bg-[var(--color-bg-tertiary)]  transition-colors",
        "font-primary text-[var(--color-text-primary)]",
        "flex items-center gap-2",
        "relative",
        isLoading && "cursor-wait opacity-70",
        isSelected && "bg-[var(--color-bg-tertiary)]  text-white"
      )}
    >
      <span className="relative z-10">{region.name}</span>
      {count > 0 && (
        <span
          className={cn(
            "ml-2 text-xs rounded-full px-2 py-0.5",
            isSelected ? "bg-white text-black" : "bg-gray-100 text-gray-600"
          )}
        >
          {count}
        </span>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-t-transparent border-[var(--color-primary)] rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
}
