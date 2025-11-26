"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import HiddenGemsMap from "@/app/components/hidden-gems/HiddenGemsMap";
import HiddenGemsGrid from "@/app/components/hidden-gems/HiddenGemsGrid";
import { Beach } from "@/app/types/beaches";
import SearchBar from "@/app/components/SearchBar";

export default function HiddenGemsPage() {
  const searchParams = useSearchParams();
  const [beaches, setBeaches] = useState<Beach[]>([]);
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get region from URL or default to a popular surf region
  const regionId = searchParams.get("regionId") || "western-cape";

  useEffect(() => {
    const fetchHiddenGems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/beaches/filter?regionId=${regionId}&isHiddenGem=true`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch hidden gems");
        }

        const data = await response.json();
        setBeaches(data.beaches || []);
      } catch (err) {
        console.error("Error fetching hidden gems:", err);
        setError("Failed to load hidden gems. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHiddenGems();
  }, [regionId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l2.286 6.857L21 12l-6.714 3.143L12 22l-2.286-6.857L3 12l6.714-3.143L12 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Hidden Gems
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Discover secret surf spots
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <SearchBar placeholder="Search hidden gems..." />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Airbnb Style Layout */}
      <div className="flex h-[calc(100vh-88px)]">
        {/* Left Side - Scrollable Grid */}
        <div className="w-full lg:w-[45%] xl:w-[40%] overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Region Info */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {beaches.length} Hidden {beaches.length === 1 ? "Gem" : "Gems"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Explore lesser-known surf breaks in this region
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Beach Grid */}
            <HiddenGemsGrid
              beaches={beaches}
              selectedBeach={selectedBeach}
              onBeachSelect={setSelectedBeach}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Side - Fixed Map */}
        <div className="hidden lg:block lg:w-[55%] xl:w-[60%] sticky top-0 h-full">
          <HiddenGemsMap
            beaches={beaches}
            selectedBeach={selectedBeach}
            onBeachSelect={setSelectedBeach}
          />
        </div>
      </div>

      {/* Mobile Map Toggle (Optional) */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => {
            // You can implement a modal map view for mobile here
            alert("Mobile map view - to be implemented");
          }}
          className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Show Map
        </button>
      </div>
    </div>
  );
}
