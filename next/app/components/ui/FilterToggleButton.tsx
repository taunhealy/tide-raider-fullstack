import { Button } from "./Button";
import { cn } from "@/app/lib/utils";

interface FilterToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export function FilterToggleButton({
  isActive,
  onClick,
  className,
}: FilterToggleButtonProps) {
  return (
    <Button
      variant="default"
      onClick={onClick}
      className={cn(
        "rounded-[21px] max-w-[320px] sm:w-auto",
        isActive && "bg-accent text-accent-foreground",
        className
      )}
    >
      <span>{isActive ? "Hide Filters" : "Show Filters"}</span>
    </Button>
  );
}
