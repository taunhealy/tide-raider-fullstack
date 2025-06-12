import { useSubscription } from "@/app/context/SubscriptionContext";
import { getScoreDisplay } from "@/app/lib/scoreUtils";
import { getConditionReasons } from "@/app/lib/surfUtils";
import { useHandleSubscribe } from "@/app/hooks/useHandleSubscribe";
import { useState, useEffect, useRef, memo } from "react";
import { InfoIcon, Eye } from "lucide-react";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import GoogleMapsButton from "@/app/components/GoogleMapsButton";
import {} from "@/app/lib/videoUtils";
import Image from "next/image";
import {
  DEFAULT_PROFILE_IMAGE,
  WAVE_TYPE_ICONS,
  WaveType,
} from "@/app/lib/constants";
import { MediaGrid } from "@/app/components/MediaGrid";
import { useQueryClient } from "@tanstack/react-query";
import type { LogEntry } from "@/app/types/raidlogs";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/app/lib/utils";
import gsap from "gsap";
import { useBeach } from "@/app/context/BeachContext";
import type { Beach } from "@/app/types/beaches";

import type { ForecastData } from "@/app/types/forecast";

interface BeachCardProps {
  beachId: string; // We only need the ID
}

const ConditionsSkeleton = () => (
  <div className="text-sm flex flex-col gap-2 animate-pulse">
    <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
    <ul className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </li>
      ))}
    </ul>
  </div>
);

const BeachCard = memo(
  function BeachCard({ beachId }: BeachCardProps) {
    const { beaches, beachScores, forecastData } = useBeach();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { isSubscribed } = useSubscription();
    const handleSubscribe = useHandleSubscribe();
    const queryClient = useQueryClient();

    const cardRef = useRef<HTMLDivElement>(null);
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const [showRatingHint, setShowRatingHint] = useState(false);
    const [showWaveTypeHint, setShowWaveTypeHint] = useState(false);
    const [isRegionSupported, setIsRegionSupported] = useState(true);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Find the beach from context
    const beach = beaches.find((b) => b.id === beachId) as Beach;
    const score = beachScores[beachId]?.score ?? 0;
    const scoreDisplay = getScoreDisplay(score);

    useEffect(() => {
      const card = cardRef.current;
      if (!card || hasAnimated) return;

      const anim = gsap.to(card, {
        opacity: 1,
        duration: 0.4,
        delay: 0.2,
        ease: "power2.out",
        onComplete: () => setHasAnimated(true),
      });

      // Modify this part to exclude tooltips
      gsap.to(card.querySelectorAll(".animate-in"), {
        // Add a specific class for elements to animate
        opacity: 1,
        duration: 0.4,
        delay: 0.2,
        ease: "power2.out",
      });

      return () => {
        anim.kill();
      };
    }, [hasAnimated]);

    // Get sessions from existing cache
    const recentEntries = queryClient.getQueryData<LogEntry[]>([
      "recentQuestEntries",
    ]);
    const beachSessions = Array.isArray(recentEntries)
      ? recentEntries.filter(
          (entry) =>
            entry.beachName?.toLowerCase() === beach.name?.toLowerCase()
        )
      : [];

    const renderRating = () => {
      console.log("Rendering rating for", beach.name, {
        score: beachScores[beachId]?.score,
        isRegionSupported,
      });

      if (!isRegionSupported) {
        return (
          <div className="text-sm text-[var(--color-text-secondary)]">
            Surf forecasts coming soon for {beach.region?.name || "this region"}
          </div>
        );
      }

      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((rating) => {
            const filled = rating <= score;
            return (
              <Star
                key={rating}
                className={cn(
                  "w-4 h-4 ",
                  filled
                    ? "text-[var(--color-tertiary)] fill-current"
                    : "text-gray-300"
                )}
              />
            );
          })}
        </div>
      );
    };

    const isModalOpen = searchParams.get("beach") === beach.name;

    const handleOpenModal = (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
      e?.stopPropagation();
      const params = new URLSearchParams(searchParams);
      params.set("beach", beach.name);
      router.push(`${pathname}?${params}`, { scroll: false });
    };

    const handleCloseModal = () => {
      const params = new URLSearchParams(searchParams);
      params.delete("beach");
      router.replace(`${pathname}?${params}`, { scroll: false });
    };

    console.log("🌊 Condition Check:", {
      beach: {
        name: beach.name,
        optimalWindDirections: beach.optimalWindDirections,
        optimalSwellDirections: beach.optimalSwellDirections,
      },
      forecast: {
        windSpeed: forecastData?.windSpeed,
        windDirection: forecastData?.windDirection,
        swellHeight: forecastData?.swellHeight,
        swellPeriod: forecastData?.swellPeriod,
        swellDirection: forecastData?.swellDirection,
      },
    });

    return (
      <>
        {/* Main Card Container */}
        <div
          ref={cardRef}
          className={`
          relative 
          group 
          bg-[var(--color-bg-primary)] 
          mt-3
          rounded-lg 
          shadow-sm 
          border border-gray-200 
          overflow-hidden 
          transition-all 
          duration-300 
          hover:shadow-md
          [&_.animate-in]:opacity-0
          ${isLocalLoading ? "animate-pulse" : ""}
        `}
        >
          <div className="px-4 py-3 md:px-6 md:py-4">
            {isLocalLoading ? (
              <ConditionsSkeleton />
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                  {/* Wave Type Icon and Beach Details */}
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* Wave Type Icon with Tooltip */}
                    <div
                      className="relative min-w-[40px] w-10 h-10 md:min-w-[54px] md:w-14 md:h-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200"
                      onMouseEnter={() => setShowWaveTypeHint(true)}
                      onMouseLeave={() => setShowWaveTypeHint(false)}
                    >
                      <Image
                        src={
                          beach.waveType &&
                          WAVE_TYPE_ICONS[beach.waveType as WaveType]
                            ? WAVE_TYPE_ICONS[beach.waveType as WaveType]
                            : WAVE_TYPE_ICONS["Beach Break"]
                        }
                        alt={`${beach.waveType || "Default"} icon`}
                        fill
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
                      />
                      {beach.waveType && (
                        <div
                          className={`
                          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                          bg-black bg-opacity-50 
                          px-3 py-1 rounded-md 
                          text-white text-sm 
                          transition-all duration-300 ease-in-out
                          whitespace-nowrap
                          ${
                            showWaveTypeHint
                              ? "opacity-100 translate-y-0"
                              : "opacity-0 translate-y-2"
                          }
                        `}
                          data-no-animation
                        >
                          {beach.waveType}
                        </div>
                      )}
                    </div>

                    {/* Beach Information */}
                    <div>
                      <h4 className="text-lg font-primary font-semibold text-[var(--color-text-primary)] md:text-xl flex items-center gap-2 animate-in">
                        {beach.name}
                        {forecastData?.windSpeed &&
                          forecastData.windSpeed > 25 && (
                            <span title="Strong winds">🌪️</span>
                          )}
                        {beach.sharkAttack?.hasAttack && (
                          <span title="At least 1 shark attack reported">
                            {beach.sharkAttack.incidents?.some(
                              (incident) =>
                                new Date(incident.date).getTime() >
                                new Date().getTime() -
                                  5 * 365 * 24 * 60 * 60 * 1000
                            )
                              ? "⋆༺𓆩☠︎︎𓆪༻⋆"
                              : "🦈"}
                          </span>
                        )}
                      </h4>
                      <h6 className="text-xs md:text-sm font-primary text-[var(--color-text-secondary)]">
                        {beach.region?.name}
                      </h6>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 md:gap-2">
                    <GoogleMapsButton
                      coordinates={beach.coordinates}
                      name={beach.name}
                      region={beach.region?.name}
                      location={beach.location}
                      className="hidden md:flex"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                      className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <InfoIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Suitability Rating and Conditions */}
                <div className="mt-1 md:mt-3">
                  {isLocalLoading ? (
                    <ConditionsSkeleton />
                  ) : beachScores[beachId]?.score !== undefined ? (
                    // Show actual conditions when we have a score
                    <div className="flex flex-col gap-1 md:gap-2">
                      <div className="flex items-center gap-2">
                        {renderRating()}

                        <div
                          className="flex items-center gap-2 relative px-2 py-1 border border-gray-200 rounded-md bg-gray-50"
                          onMouseEnter={() => setShowRatingHint(true)}
                          onMouseLeave={() => setShowRatingHint(false)}
                        >
                          <div>{scoreDisplay.emoji}</div>

                          <div
                            className={`
                          absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 
                          px-3 py-1 bg-gray-900 text-white text-sm rounded-md 
                          transition-opacity whitespace-nowrap
                          ${showRatingHint ? "opacity-100" : "opacity-0"}
                        `}
                          >
                            {scoreDisplay.description}
                          </div>
                        </div>
                      </div>

                      {/* Current Conditions */}
                      <div className="text-sm flex flex-col gap-1 border-t border-gray-200 pt-3 mt-3">
                        <ul className="space-y-1.5">
                          {getConditionReasons(
                            beach,
                            forecastData,
                            false
                          ).optimalConditions.map((condition, index, array) => (
                            <li
                              key={index}
                              className={`flex items-center gap-2 md:gap-2 pb-2 ${
                                index !== array.length - 1
                                  ? "border-b border-gray-200"
                                  : ""
                              }`}
                            >
                              <span className="inline-flex items-center justify-center w-4 h-4">
                                {condition.isMet ? (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4 text-[var(--color-tertiary)]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                  >
                                    <path
                                      d="M20 6L9 17L4 12"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4 text-[var(--color-text-secondary)]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                  >
                                    <path
                                      d="M18 6L6 18M6 6l12 12"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                              <span
                                className={`text-xs md:text-sm ${
                                  condition.isMet
                                    ? "text-gray-800"
                                    : "text-gray-500"
                                }`}
                              >
                                <span className="font-medium md:font-semibold font-primary">
                                  {condition.text.split(":")[0]}:
                                </span>{" "}
                                <span className="font-normal font-primary">
                                  {condition.text.split(":")[1]}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    // Show optimal conditions when no surf data is available
                    <div className="text-sm flex flex-col gap-1">
                      <p className="text-base font-semibold font-primary md:text-lg">
                        Optimal Conditions:
                      </p>
                      <ul className="space-y-1">
                        <li className="text-xs md:text-sm flex items-center gap-1 font-primary text-gray-600">
                          <span className="font-medium">Wind Direction:</span>
                          {beach.optimalWindDirections.join(", ")}
                        </li>
                        <li className="text-xs md:text-sm flex items-center gap-1 font-primary text-gray-600">
                          <span className="font-medium">Swell Direction:</span>
                          {beach.optimalSwellDirections.min}° -{" "}
                          {beach.optimalSwellDirections.max}°
                        </li>
                        <li className="text-xs md:text-sm flex items-center gap-1 font-primary text-gray-600">
                          <span className="font-medium">Wave Size:</span>
                          {beach.swellSize.min}m - {beach.swellSize.max}m
                        </li>
                        <li className="text-xs md:text-sm flex items-center gap-1 font-primary text-gray-600">
                          <span className="font-medium">Swell Period:</span>
                          {beach.idealSwellPeriod.min}s -{" "}
                          {beach.idealSwellPeriod.max}s
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Media Grid - Now inside the card */}
                <div className="mt-3 md:mt-4">
                  <MediaGrid beach={beach} videos={beach.videos} />
                </div>
              </div>
            )}
          </div>

          {/* Quick View Button */}
          <Link
            href={`/beach/${beach.name}`}
            scroll={false}
            className="
          absolute 
          bottom-2 
          right-2 
          md:bottom-3 
          md:right-3 
          opacity-0 
          group-hover:opacity-100 
          transition-opacity
          bg-gray-50
          p-1.5
          md:p-2
          rounded-full
        "
          >
            <Eye className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </Link>
        </div>

        {/* Only render modal if it's the selected beach */}
        {isModalOpen && (
          <BeachDetailsModal
            beach={beach}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            isSubscribed={isSubscribed}
            onSubscribe={handleSubscribe}
          />
        )}
      </>
    );
  },
  (prev, next) => prev.beachId === next.beachId
);

export default BeachCard;
