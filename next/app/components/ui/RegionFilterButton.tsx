import { cn } from "@/app/lib/utils";
import { Badge } from "@/app/components/ui/badge";

interface RegionFilterButtonProps {
  region: string;
  isSelected: boolean;
  onClick: () => void;
  count?: number;
  isLoading?: boolean;
}

export default function RegionFilterButton({
  region,
  isSelected,
  onClick,
  count,
  isLoading = false,
}: RegionFilterButtonProps) {
  console.log(`RegionFilterButton ${region} received count:`, count);

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
        "flex items-center justify-between gap-2",
        "border",
        "font-primary",
        isSelected
          ? "bg-cyan-50 border-cyan-200 text-cyan-800"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      )}
    >
      <span>{region}</span>

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
