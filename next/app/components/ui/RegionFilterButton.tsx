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
  // Handle 2-letter ISO codes properly
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
  const countryName = region.country?.name || region.countryId?.toUpperCase();

  return (
    <button
      onClick={() => {
        onClick(region);
      }}
      title={countryName ? `Region in ${countryName}` : undefined}
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
      <span className="flex items-center gap-1.5 relative z-10">
        {flagEmoji && (
          <span className="text-base leading-none" aria-hidden="true">
            {flagEmoji}
          </span>
        )}
        <span>
          {region.name ||
            region.id
              ?.split("-")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")}
        </span>
      </span>
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
