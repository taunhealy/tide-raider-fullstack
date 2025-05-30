"use client";

import { useState, useEffect } from "react";

interface DataLoadingProgressProps {
  isLoading: boolean;
  progress?: number;
  className?: string;
}

export default function DataLoadingProgress({
  isLoading,
  progress = 0,
  className = "",
}: DataLoadingProgressProps) {
  const [scrapingProgress, setScrapingProgress] = useState(progress);

  // Simulate progress if no progress is provided
  useEffect(() => {
    if (!isLoading) {
      setScrapingProgress(0);
      return;
    }

    if (progress > 0) {
      setScrapingProgress(progress);
      return;
    }

    // Simulate progress
    const interval = setInterval(() => {
      setScrapingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isLoading, progress]);

  if (!isLoading) return null;

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-md border border-gray-200 ${className}`}
    >
      <h4 className="font-primary text-base font-medium text-gray-800 mb-4">
        Surf Data Collection in Progress
      </h4>
      <ul className="space-y-3">
        <li className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${scrapingProgress >= 25 ? "bg-[var(--color-tertiary)]" : "bg-gray-200"}`}
          >
            {scrapingProgress >= 25 && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="font-primary text-sm font-medium">
              Fetching forecast data
            </p>
            <p className="font-primary text-xs text-gray-500">
              Connecting to weather services
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${scrapingProgress >= 50 ? "bg-[var(--color-tertiary)]" : "bg-gray-200"}`}
          >
            {scrapingProgress >= 50 && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="font-primary text-sm font-medium">
              Processing conditions
            </p>
            <p className="font-primary text-xs text-gray-500">
              Analyzing wind and swell data
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${scrapingProgress >= 75 ? "bg-[var(--color-tertiary)]" : "bg-gray-200"}`}
          >
            {scrapingProgress >= 75 && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="font-primary text-sm font-medium">
              Calculating surf quality
            </p>
            <p className="font-primary text-xs text-gray-500">
              Determining optimal conditions
            </p>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <div
            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${scrapingProgress >= 100 ? "bg-[var(--color-tertiary)]" : "bg-gray-200"}`}
          >
            {scrapingProgress >= 100 && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="font-primary text-sm font-medium">
              Finalizing results
            </p>
            <p className="font-primary text-xs text-gray-500">
              Preparing surf recommendations
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
