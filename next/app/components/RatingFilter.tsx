"use client";

import { Star } from "lucide-react";

interface RatingFilterProps {
  minRating: number | null;
  onChange: (rating: number | null) => void;
}

export function RatingFilter({ minRating, onChange }: RatingFilterProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Minimum Rating</h3>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating === minRating ? null : rating)}
            className={`p-2 rounded ${
              minRating && rating <= minRating
                ? "text-yellow-500"
                : "text-gray-300"
            }`}
          >
            <Star size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}
