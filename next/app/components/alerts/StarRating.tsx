// StarRating.tsx
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";

interface StarRatingProps {
  rating: number | null;
}

export function StarRating({ rating }: StarRatingProps) {
  if (rating === null) return null;

  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      <p className="font-medium mb-2">Alert for:</p>
      <div className="flex items-center mt-1 bg-gray-50 p-3 rounded-md">
        <BlueStarRating score={rating} outOfFive={true} />
        <span className="ml-3 font-primary">{rating}+ Stars</span>
      </div>
    </div>
  );
}
