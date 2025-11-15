import React from "react";
import { cn } from "./utils";

const StarIcon = ({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
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
          return (
            <StarIcon key={rating} className="text-[var(--color-tertiary)]" />
          );
        }
        if (hasHalfStar && rating === fullStars + 1) {
          return (
            <div key={rating} className="opacity-50">
              <StarIcon className="text-[var(--color-tertiary)]" />
            </div>
          );
        }
        return (
          <div key={rating} className="opacity-20">
            <StarIcon className="text-[var(--color-tertiary)]" />
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
  const handleClick = (value: number) => {
    console.log("Star clicked:", value, "Current rating:", rating);
    onRatingChange(value);
  };

  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((value) => {
        const isSelected = value <= rating;
        return (
          <button
            key={value}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClick(value);
            }}
            className={cn(
              "p-1 transition-all duration-200 cursor-pointer",
              "hover:scale-110 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)] focus:ring-offset-1 rounded",
              isSelected
                ? "text-[var(--color-tertiary)]"
                : "text-gray-300 hover:text-[var(--color-tertiary)]/50"
            )}
            aria-label={`Rate ${value} out of 5`}
          >
            <StarIcon
              size={size}
              className={
                isSelected ? "text-[var(--color-tertiary)]" : "text-gray-300"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
