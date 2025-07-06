import React from "react";
import { cn } from "./utils";

const StarIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className="text-[var(--color-tertiary)]"
  >
    <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
  </svg>
);

// Display-only version for showing ratings
export function BlueStarRating({
  score,
  outOfFive = false,
}: {
  score: number;
  outOfFive?: boolean;
}) {
  const scoreOutOfFive = outOfFive ? score : score / 2;
  const fullStars = Math.floor(scoreOutOfFive);
  const hasHalfStar = outOfFive ? false : score % 2 === 1;

  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => {
        const rating = i + 1;
        if (rating <= fullStars) {
          return <StarIcon key={rating} />;
        }
        if (hasHalfStar && rating === fullStars + 1) {
          return (
            <div key={rating} className="opacity-50">
              <StarIcon />
            </div>
          );
        }
        return (
          <div key={rating} className="opacity-20">
            <StarIcon />
          </div>
        );
      })}
    </div>
  );
}

// Interactive version for input
interface InteractiveBlueStarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}

export function InteractiveBlueStarRating({
  rating,
  onRatingChange,
  size = 16,
}: InteractiveBlueStarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onRatingChange(value)}
          className={cn(
            "p-1 transition-colors",
            value <= rating
              ? "text-[var(--color-tertiary)]"
              : "text-gray-300 hover:text-[var(--color-tertiary)]/50"
          )}
        >
          <StarIcon size={size} />
        </button>
      ))}
    </div>
  );
}
