"use client";

import { Beach } from "@/app/types/beaches";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface HiddenGemsGridProps {
  beaches: Beach[];
  selectedBeach: Beach | null;
  onBeachSelect: (beach: Beach | null) => void;
  isLoading?: boolean;
}

export default function HiddenGemsGrid({
  beaches,
  selectedBeach,
  onBeachSelect,
  isLoading = false,
}: HiddenGemsGridProps) {
  const router = useRouter();

  const handleBeachClick = (beach: Beach) => {
    if (selectedBeach?.id === beach.id) {
      onBeachSelect(null);
    } else {
      onBeachSelect(beach);
    }
  };

  const handleViewDetails = (beach: Beach, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/raid?regionId=${beach.regionId}&searchQuery=${beach.name}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md animate-pulse"
          >
            <div className="h-48 bg-gray-200 dark:bg-gray-700" />
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (beaches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <svg
          className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Hidden Gems Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
          Try selecting a different region or check back later as we discover more
          secret surf spots.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {beaches.map((beach) => {
        const isSelected = selectedBeach?.id === beach.id;
        
        return (
          <div
            key={beach.id}
            onClick={() => handleBeachClick(beach)}
            className={`
              bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md
              cursor-pointer transition-all duration-200 hover:shadow-xl
              ${
                isSelected
                  ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20"
                  : "hover:scale-[1.02]"
              }
            `}
          >
            {/* Beach Image */}
            <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400">
              {beach.profileImage || beach.image ? (
                <Image
                  src={beach.profileImage || beach.image || ""}
                  alt={beach.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                    />
                  </svg>
                </div>
              )}
              
              {/* Hidden Gem Badge */}
              <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-purple-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l2.286 6.857L21 12l-6.714 3.143L12 22l-2.286-6.857L3 12l6.714-3.143L12 2z" />
                </svg>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  Hidden Gem
                </span>
              </div>
            </div>

            {/* Beach Info */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {beach.name}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {beach.location}
              </p>

              {/* Beach Details */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  {beach.waveType.replace(/_/g, " ")}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  {beach.difficulty}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">
                {beach.description}
              </p>

              {/* Action Button */}
              <button
                onClick={(e) => handleViewDetails(beach, e)}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium text-sm hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                View Details
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
