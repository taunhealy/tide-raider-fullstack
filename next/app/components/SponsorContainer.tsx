"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/app/lib/utils";
import { getWindEmoji } from "@/app/lib/forecastUtils";
import { getSwellEmoji } from "@/app/lib/forecastUtils";
import { getDirectionEmoji } from "@/app/lib/forecastUtils";
import { degreesToCardinal } from "@/app/lib/forecastUtils";
import { LogEntry } from "@/app/types/raidlogs";

const SponsorContainer = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Fetch surf logs using React Query
  const { data: logs } = useQuery({
    queryKey: ["questLogs"],
    queryFn: async () => {
      const response = await fetch("/api/raid-logs");
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      return data.entries as LogEntry[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get most recent log
  const recentLog = logs?.[0];

  useEffect(() => {
    const handleScroll = () => {
      const mainForecast = document.querySelector("[data-forecast-widget]");
      const footer = document.querySelector("footer");
      if (!mainForecast || !footer) return;

      const forecastRect = mainForecast.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      setIsVisible(
        forecastRect.bottom < 0 && footerRect.top > windowHeight - 100
      );
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!recentLog) return null;

  return (
    <div
      className={cn(
        "fixed bottom-9 right-4 bg-white rounded-lg shadow-lg p-4 z-50",
        "transition-all duration-300 ease-in-out",
        "transform hidden md:block cursor-pointer hover:shadow-xl",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 pointer-events-none"
      )}
      onClick={() => window.open("/raidlogs", "_blank")}
    >
      <div className="flex items-center gap-4">
        {/* Log Display */}
        <div className="pl-4 pr-12 pt-4">
          <div className="flex flex-col">
            <div className="mb-2">
              <h3 className="text-lg font-semibold">Logged Session</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {new Date(recentLog.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <p className="text-sm font-normal text-[var(--color-text-secondary)]">
              {recentLog.surferName}
            </p>
            <div className="flex justify-between items-start mt-1">
              <div className="space-y-1">
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-secondary)]">
                  {recentLog.beachName}
                </p>
                <div className="flex items-center justify-start space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-[12px] ${
                        i < Math.floor(recentLog.surferRating ?? 0)
                          ? "opacity-100"
                          : "opacity-20"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {/* Forecast Information */}
              <div className="text-right space-y-1 ml-4">
                {recentLog?.forecast && (
                  <>
                    <div className="text-[12px] text-[var(--color-text-secondary)]">
                      {getWindEmoji(Number(recentLog.forecast.windSpeed))}{" "}
                      {degreesToCardinal(
                        Number(recentLog.forecast.windDirection)
                      )}{" "}
                      @ {recentLog.forecast.windSpeed}kts
                    </div>
                    <div className="text-[12px] text-[var(--color-text-secondary)]">
                      {getSwellEmoji(recentLog.forecast.swellHeight)}{" "}
                      {recentLog.forecast.swellHeight}m @{" "}
                      {recentLog.forecast.swellPeriod}s{" "}
                      {getDirectionEmoji(recentLog.forecast.swellDirection)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wave Animation Circle */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden group"></div>
      </div>
    </div>
  );
};

export default SponsorContainer;
