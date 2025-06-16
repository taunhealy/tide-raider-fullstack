import { Slider } from "../ui/slider";
import { StarIcon } from "lucide-react";

// components/StarRatingSelector.tsx
interface StarRatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export function StarRatingSelector({
  value,
  onChange,
}: StarRatingSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Slider
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          min={1}
          max={5}
          step={1}
          className="[&>span]:bg-[var(--color-tertiary)]"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex">
          {Array.from({ length: value }).map((_, i) => (
            <StarIcon
              key={i}
              className="h-5 w-5 text-yellow-400 fill-current"
            />
          ))}
          {Array.from({ length: 5 - value }).map((_, i) => (
            <StarIcon key={i} className="h-5 w-5 text-gray-300" />
          ))}
        </div>
        <span className="font-primary text-sm text-gray-600">
          {value} {value === 1 ? "star" : "stars"}
        </span>
      </div>
    </div>
  );
}
