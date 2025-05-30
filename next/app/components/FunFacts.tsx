"use client";

import { useState, useEffect } from "react";
import { funFacts, type FunFact } from "@/data/funfacts";
import { cn } from "@/app/lib/utils";

export default function FunFacts() {
  const [currentFact, setCurrentFact] = useState<FunFact | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set initial fact only on client side
    const randomIndex = Math.floor(Math.random() * funFacts.length);
    setCurrentFact(funFacts[randomIndex]);

    const interval = setInterval(() => {
      setIsLoading(true);
      // Wait for fade out animation to complete (300ms) before changing content
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * funFacts.length);
        setCurrentFact(funFacts[randomIndex]);
        // Small delay before starting fade in
        requestAnimationFrame(() => {
          setIsLoading(false);
        });
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!currentFact) return null;

  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-sm p-6",
        "min-h-[240px]",
        "flex flex-col",
        "font-primary"
      )}
    >
      <h3
        className={cn(
          "heading-6",
          " text-[var(--color-text-primary)]",
          "mb-6 font-primary"
        )}
      >
        Did You Know?
      </h3>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isLoading
            ? "opacity-0 transform translate-y-2"
            : "opacity-100 transform translate-y-0"
        )}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">
            {getCategoryIcon(currentFact.category)}
          </span>
          <div>
            <p className="text-sm text-gray-700">{currentFact.fact}</p>
            {currentFact.source && (
              <p className="text-xs text-gray-500 mt-1">
                Source:{" "}
                {currentFact.sourceUrl ? (
                  <a
                    href={currentFact.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-[var(--color-brand-tertiary)]"
                  >
                    {currentFact.source}
                  </a>
                ) : (
                  currentFact.source
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(category: FunFact["category"]) {
  switch (category) {
    case "marine-life":
      return "🐋";
    case "surf-history":
      return "🏄‍♂️";
    case "environment":
      return "🌊";
    case "culture":
      return "🏆";
    default:
      return "🏄‍♂️";
  }
}
