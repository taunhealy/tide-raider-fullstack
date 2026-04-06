import { cn } from "@/app/lib/utils";
import type { Region } from "@/app/types/beaches";

interface RegionFilterButtonProps {
  region: Region;
  isSelected: boolean;
  isLoading?: boolean;
  onClick: (region: Region) => void;
  count: number;
}

const getCountryFlag = (countryId?: string) => {
  if (!countryId) return "";
  const code = countryId.toUpperCase();
  if (code.length !== 2) return "";
  return String.fromCodePoint(
    ...code.split("").map((char) => 127397 + char.charCodeAt(0))
  );
};

export default function RegionFilterButton({
  region,
  isSelected,
  isLoading,
  onClick,
  count,
}: RegionFilterButtonProps) {
  const flagEmoji = getCountryFlag(region.countryId);

  return (
    <button
      onClick={() => onClick(region)}
      disabled={isLoading}
      className={cn(
        "relative px-4 py-2.5 rounded-xl transition-all duration-300 group/region",
        "border flex items-center gap-3 w-fit",
        isLoading && "cursor-wait opacity-70",
        isSelected
          ? "bg-gray-800 border-gray-800 text-white shadow-lg"
          : "bg-white border-gray-100 text-gray-900 hover:bg-gray-50 transition-colors"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {flagEmoji && (
          <span className={cn(
            "text-base leading-none p-1 rounded-lg shrink-0 transition-colors",
            isSelected ? "bg-white/20" : "bg-gray-100 group-hover/region:bg-white"
          )}>
            {flagEmoji}
          </span>
        )}
        <span className="font-semibold truncate text-xs tracking-tight">
          {region.name || region.id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")}
        </span>
      </div>

      {count > 0 && (
        <span className={cn(
          "text-[9px] font-black px-1.5 py-0.5 rounded-lg shrink-0 transition-colors",
          isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400 group-hover/region:bg-white"
        )}>
          {count}
        </span>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}
