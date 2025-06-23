// StarRating.tsx
import { Star as StarIcon } from "lucide-react";

interface StarRatingProps {
  rating: number | null;
}

export function StarRating({ rating }: StarRatingProps) {
  if (rating === null) return null;

  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <p className="font-medium mb-2">Alert for:</p>
      <div className="flex items-center mt-1 bg-gray-50 p-3 rounded-md">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <StarIcon
              key={i}
              className={`h-5 w-5 ${
                i <= (rating || 0)
                  ? "fill-[var(--color-alert-icon-rating)] text-[var(--color-alert-icon-rating)]"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="ml-3 font-primary">{rating}+ Stars</span>
      </div>
    </div>
  );
}