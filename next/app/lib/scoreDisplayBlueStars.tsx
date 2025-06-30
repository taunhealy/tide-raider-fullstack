import React from "react";
import { cn } from "./utils";

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="rgb(34, 211, 238)">
    <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
  </svg>
);

// New separate function for blue stars
export function BlueStarRating({ score }: { score: number }) {
  // Convert score from 0-10 scale back to 0-5 scale
  const scoreOutOfFive = score / 2;
  const fullStars = Math.floor(scoreOutOfFive);
  const hasHalfStar = score % 2 === 1; // If odd number, we have a half star

  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => {
        const rating = i + 1;
        // Full star if rating is less than or equal to the whole number part
        if (rating <= fullStars) {
          return <StarIcon key={rating} />;
        }
        // Half star if we have a .5 and this is the next star after the full ones
        if (hasHalfStar && rating === fullStars + 1) {
          return (
            <div key={rating} className="opacity-50">
              <StarIcon />
            </div>
          );
        }
        // Empty star for the rest
        return (
          <div key={rating} className="opacity-20">
            <StarIcon />
          </div>
        );
      })}
    </div>
  );
}
