import { cn } from "@/app/lib/utils";

interface FilterButtonProps {
  label: string;
  count?: number;
  variant: "region" | "category" | "continent" | "country";
  isSelected: boolean;
  onClick: () => void;
}

export function FilterButton({
  label,
  count,
  variant,
  isSelected,
  onClick,
}: FilterButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "continent":
        return isSelected
          ? "bg-white text-black border-black"
          : "bg-white text-black border-gray-100 hover:bg-gray-50";
      case "country":
        return isSelected
          ? "bg-white text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]"
          : "bg-white text-black border-gray-100 hover:bg-gray-50";
      case "region":
        return isSelected
          ? "bg-white text-black border-gray-400"
          : "bg-white text-black border-gray-100 hover:bg-gray-50";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative rounded-[32px] flex items-center",
        "px-[16px] py-1 gap-2",
        "border whitespace-nowrap",
        "text-main font-primary",
        getVariantStyles()
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-2 bg-gray-200 px-2 py-0.5 rounded-full text-xs">
          {count}
        </span>
      )}
    </button>
  );
}
