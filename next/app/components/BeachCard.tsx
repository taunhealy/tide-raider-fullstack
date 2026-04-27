import { useSubscription } from "@/app/context/SubscriptionContext";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { getScoreDisplay } from "@/app/lib/scoreDisplay";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import { getConditionReasons } from "@/app/lib/surfUtils";
import { useHandleSubscribe } from "@/app/hooks/useHandleSubscribe";
import { useState, useEffect, useRef, memo } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Lock, 
  Star, 
  InfoIcon, 
  Eye, 
  Sparkles 
} from "lucide-react";
import AIReportModal from "./beach/AIReportModal";
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
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import gsap from "gsap";
import type { Beach } from "@/app/types/beaches";
import { ErrorBoundary } from "./ErrorBoundary";
import BeachCardSkeleton from "./skeletons/BeachCardSkeleton";

import { CoreForecastData } from "@/app/types/forecast";
import { Button } from "@/app/components/ui/Button";

interface BeachCardProps {
  beach: Beach;
  score: number | null; // Allow null to indicate "no score yet"
  forecastData: CoreForecastData | null;
  onOpenModal?: (beachName: string) => void;
  onCloseModal?: () => void;
  isLoading: boolean;
  distance?: number | null;
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

// Helper function to format wave type enum to display name
const formatWaveType = (waveType: string | undefined): string => {
  if (!waveType) return "Beach Break";

  // Convert enum values like "BEACH_BREAK" to "Beach Break"
  return waveType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Helper function to format region name
const formatRegionName = (
  regionName: string | undefined,
  regionId: string | undefined
): string => {
  if (regionName) return regionName;
  if (regionId) {
    return regionId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  return "";
};

const BeachCard = memo(function BeachCard({
  beach,
  score,
  forecastData,
  isLoading,
  distance,
}: BeachCardProps) {
  // Add enhanced debug logging
  console.log(`Rendering beach ${beach.name} with data:`, {
    score,
    scoreType: typeof score,
    beachId: beach.id,
    hasForecastData: !!forecastData,
    forecastDetails: forecastData
      ? {
          windSpeed: forecastData.windSpeed,
          windDirection: forecastData.windDirection,
          swellHeight: forecastData.swellHeight,
          swellPeriod: forecastData.swellPeriod,
        }
      : null,
  });

  console.log("Beach card forecast data:", {
    beachId: beach.id,
    forecastData,
    hasForecastData: !!forecastData,
    forecastProperties: forecastData ? Object.keys(forecastData) : [],
  });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use direct backend subscription check (more reliable than context)
  const {
    isSubscribed,
    hasActiveTrial,
    isPremium: directIsPremium,
    subscriptionStatus,
    isLoading: isSubscriptionLoading,
  } = useSubscriptionStatus();

  // Fallback to context for session data
  const { session } = useSubscription();
  const handleSubscribe = useHandleSubscribe();
  const queryClient = useQueryClient();

  // All beaches are now unlocked for everyone
  const isLocked = false;

  // Debug logging for beach data
  console.log(`[BeachCard] ${beach.name} - Data:`, {
    score,
    isLocked,
    subscriptionStatus,
    sessionUser: session?.user,
    userId: session?.user?.id,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [showRatingHint, setShowRatingHint] = useState(false);
  const [showWaveTypeHint, setShowWaveTypeHint] = useState(false);
  const [isRegionSupported, setIsRegionSupported] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showIdealConditions, setShowIdealConditions] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Use score directly instead of looking it up
  const scoreDisplay = getScoreDisplay(score ?? 0);

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
          // Check both beachId and beachName
          entry.beachName?.toLowerCase() === beach.name?.toLowerCase()
      )
    : [];

  const renderRating = () => {
    // Convert 0-10 score to 1-5 star rating consistent with backend logic
    const starsToFill = Math.floor((score || 0) / 2);
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => {
          const filled = rating <= starsToFill;
          return (
            <Star
              key={rating}
              className={cn(
                "w-4 h-4",
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

  // Auto-open AI modal if deep-linked via URL (report history)
  useEffect(() => {
    const reportId = searchParams.get("report");
    const reportBeachId = searchParams.get("beachId");
    
    // Support matching by ID (from history page) or Name (from regular UI)
    if (reportId && (reportBeachId === beach.id || searchParams.get("beachName") === beach.name)) {
      setIsAIModalOpen(true);
    }
  }, [searchParams, beach.id, beach.name]);

  const handleOpenModal = (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e?.stopPropagation();
    const params = new URLSearchParams(searchParams);
    params.set("beach", beach.name);
    router.push(`${pathname}?${params}`, { scroll: false });
  };

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("beach");
    params.delete("report");
    params.delete("beachId");
    params.delete("beachName");
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  const handleCloseAIModal = () => {
    setIsAIModalOpen(false);
    // Also clear URL params if we were deep-linked
    if (searchParams.get("report")) {
      const params = new URLSearchParams(searchParams);
      params.delete("report");
      params.delete("beachId");
      params.delete("beachName");
      router.replace(`${pathname}?${params}`, { scroll: false });
    }
  };

  if (isLocalLoading) {
    return <BeachCardSkeleton count={1} />;
  }

  return (
    <ErrorBoundary>
      {/* Main Card Container */}
      <div
        ref={cardRef}
        className={`
        relative 
        group 
        bg-[var(--color-bg-primary)] 
        mt-3
        rounded-2xl 
        shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_1px_4px_-1px_rgba(0,0,0,0.02)]
        border border-gray-200
        overflow-hidden 
        transition-all 
        duration-300 
        hover:bg-slate-50/50
        hover:shadow-md
        w-full
        ${isLocalLoading ? "animate-pulse" : ""}
      `}
      >
        <div className="px-4 py-3 md:px-6 md:py-4">
          {isLocalLoading || isLoading ? (
            <ConditionsSkeleton />
          ) : score !== null && typeof score === "number" && forecastData ? (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                {/* Wave Type Icon and Beach Details */}
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Wave Type Icon with Tooltip */}

                  {/* Beach Information */}
                  <div>
                    <h4 className="text-lg font-primary font-bold text-[var(--color-text-primary)] md:text-xl flex items-center flex-wrap gap-2 transition-all">
                      {beach.name}
                      {beach.isHiddenGem && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-brand-3/10 text-brand-3 text-[9px] font-black uppercase tracking-widest border border-brand-3/20">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          Hidden Gem
                        </span>
                      )}
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
                    <h6 className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {beach.location && (
                        <>
                          <span className="font-primary text-[11px] leading-[16px] font-medium tracking-tight text-gray-500">
                            {beach.location}
                          </span>
                          <span className="opacity-20 text-[8px] mt-0.5">•</span>
                        </>
                      )}
                      {distance !== undefined && distance !== null && (
                        <>
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-3/5 rounded-md border border-brand-3/10">
                            <span className="text-[10px] font-bold text-brand-3">
                              {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                            </span>
                          </div>
                          <span className="opacity-20 text-[8px] mt-0.5">•</span>
                        </>
                      )}
                      <span className="font-primary text-[12px] leading-[16px] font-semibold tracking-[-0.3px] text-black">
                        {formatRegionName(beach.region?.name, beach.regionId)}
                      </span>
                    </h6>
                  </div>
                </div>

                {/* Action Buttons - Hide when locked */}
                {!isLocked && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <GoogleMapsButton
                      coordinates={beach.coordinates}
                      name={beach.name}
                      region={beach.region?.name}
                      location={beach.location}
                      className="hidden md:flex"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAIModalOpen(true);
                      }}
                      className="p-1.5 md:p-2 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors group/ai relative"
                      aria-label="AI Weekly Report"
                    >
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 text-[6px] text-white items-center justify-center font-bold">AI</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                      className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="View beach details"
                    >
                      <InfoIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Suitability Rating and Conditions */}
              <div className="mt-1 md:mt-3">
                {isLocalLoading || isLoading ? (
                  <ConditionsSkeleton />
                ) : score !== null &&
                  typeof score === "number" &&
                  forecastData ? (
                  // Show actual conditions when we have both score and forecast data
                  <div className="flex flex-col gap-1 md:gap-2">
                    <div className="flex items-center gap-2">
                      <BlueStarRating score={score} />

                      <div
                        className="flex items-center gap-2 relative px-2.5 py-1.5 border border-gray-100 rounded-xl bg-white shadow-sm"
                        onMouseEnter={() => setShowRatingHint(true)}
                        onMouseLeave={() => setShowRatingHint(false)}
                      >
                        <div className="text-base">{scoreDisplay.emoji}</div>

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

                    {/* Latest Session Log */}
                    {beachSessions[0] && (
                      <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50/50 -mx-4 px-4 py-3 md:-mx-6 md:px-6 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 leading-none mb-1">
                            LATEST SURF LOG
                          </span>
                          <div className="flex items-center gap-2">
                            <BlueStarRating score={beachSessions[0].surferRating || 0} size={12} />
                            <span className="font-primary text-[11px] font-bold text-gray-400">
                              / 5.0
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-primary text-[12px] font-semibold text-black leading-none mb-1">
                            {format(new Date(beachSessions[0].date), "MMM d")}
                          </div>
                          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 leading-none">
                            DATE
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add the Show/Hide Conditions button here - ALWAYS present */}
                    <div className="flex flex-col gap-1 mt-3">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-white text-gray-900 hover:bg-gray-50 font-semibold text-[11px] tracking-tight shadow-sm transition-all duration-300 w-fit active:scale-95"
                        onClick={() => setShowIdealConditions((v) => !v)}
                        aria-expanded={showIdealConditions}
                        aria-controls={`ideal-conditions-${beach.id}`}
                      >
                        <span className="uppercase tracking-widest text-[9px] text-gray-400">Conditions</span>
                        <span>
                          {showIdealConditions
                            ? "Hide"
                            : "Show"}
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showIdealConditions ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div
                        id={`ideal-conditions-${beach.id}`}
                        className={`transition-all duration-300 overflow-hidden ${showIdealConditions ? "max-h-[500px] mt-2 opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <div className="grid grid-cols-1 gap-3 py-3 border-t border-gray-100">
                          {getConditionReasons(beach, forecastData, false).optimalConditions.map((condition, idx) => {
                            const [label, value] = condition.text.split(":");
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <div className={cn(
                                  "w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-200 shrink-0",
                                    condition.isMet 
                                      ? "border-brand-3/20 bg-brand-3/10 text-brand-3 shadow-sm" 
                                      : "border-gray-100 bg-gray-50 text-gray-300"
                                )}>
                                  {condition.isMet ? (
                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="4">
                                      <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="4">
                                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 leading-none mb-1">
                                    {label}
                                  </span>
                                  <span className="font-primary text-[12px] font-semibold text-black leading-none truncate">
                                    {value}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show optimal conditions when no surf data is available
                  <div className="text-sm flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 p-0 h-auto font-primary text-[12px] leading-[16px] font-semibold tracking-[-0.3px] text-black w-fit hover:bg-transparent"
                      onClick={() => setShowIdealConditions((v) => !v)}
                      aria-expanded={showIdealConditions}
                      aria-controls={`ideal-conditions-${beach.id}`}
                    >
                      <span>
                        {showIdealConditions
                          ? "Hide Conditions"
                          : "Show Conditions"}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${showIdealConditions ? "rotate-180" : ""}`}
                      />
                    </Button>
                    <div
                      id={`ideal-conditions-${beach.id}`}
                      className={`transition-all duration-300 overflow-hidden ${showIdealConditions ? "max-h-[500px] mt-2 opacity-100" : "max-h-0 opacity-0"}`}
                    >
                      <div className="grid grid-cols-1 gap-3 py-3 border-t border-gray-100">
                        {[
                          { label: "Optimal Wind", value: (beach.optimalWindDirections || []).join(", ") },
                          { label: "Wind Speed", value: "0-25kts" },
                          { label: "Optimal Swell Direction", value: `${beach.optimalSwellDirections?.min || 0}° - ${beach.optimalSwellDirections?.max || 360}°` },
                          { label: "Optimal Wave Size", value: `${beach.swellSize?.min || 0}m - ${beach.swellSize?.max || 10}m` },
                          { label: "Optimal Swell Period", value: `${beach.idealSwellPeriod?.min || 0}s - ${beach.idealSwellPeriod?.max || 25}s` }
                        ].map((item, idx) => (
                          <div key={idx} className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1">
                              {item.label}
                            </span>
                            <span className="font-primary text-[12px] font-semibold text-black">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Media Grid - Only show if videos exist */}
              {beach.videos && beach.videos.length > 0 && (
                <div className="mt-3 md:mt-4">
                  <ErrorBoundary>
                    <MediaGrid
                      beach={{
                        id: beach.id,
                        name: beach.name,
                        region: {
                          id: beach.regionId,
                          name: beach.region?.name || "",
                          country: beach.country,
                        },
                        logEntries: beach.logEntries,
                      }}
                      videos={beach.videos}
                      isLocked={isLocked}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {/* Wave Type Indicator - Bottom Right */}
              <div className="absolute bottom-3 right-4 md:bottom-4 md:right-6">
                <span className="font-primary text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 bg-gray-50/80 px-2 py-1 rounded-md border border-gray-100/50 backdrop-blur-[2px]">
                  {formatWaveType(beach.waveType)}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                {/* Wave Type Icon and Beach Details */}
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Wave Type Icon with Tooltip */}

                  {/* Beach Information */}
                  <div>
                    <h4 className="text-lg font-primary font-bold text-[var(--color-text-primary)] md:text-xl flex items-center flex-wrap gap-2 transition-all">
                      {beach.name}
                      {beach.isHiddenGem && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-brand-3/10 text-brand-3 text-[9px] font-black uppercase tracking-widest border border-brand-3/20">
                          <Lock className="w-2.5 h-2.5 mr-1" />
                          Hidden Gem
                        </span>
                      )}
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
                    <h6 className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {beach.location && (
                        <>
                          <span className="font-primary text-[11px] leading-[16px] font-medium tracking-tight text-gray-500">
                            {beach.location}
                          </span>
                          <span className="opacity-20 text-[8px] mt-0.5">•</span>
                        </>
                      )}
                      <span className="font-primary text-[12px] leading-[16px] font-semibold tracking-[-0.3px] text-black">
                        {formatRegionName(beach.region?.name, beach.regionId)}
                      </span>
                    </h6>
                  </div>
                </div>

                {/* Action Buttons - Hide when locked */}
                {!isLocked && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <GoogleMapsButton
                      coordinates={beach.coordinates}
                      name={beach.name}
                      region={beach.region?.name}
                      location={beach.location}
                      className="hidden md:flex"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAIModalOpen(true);
                      }}
                      className="p-1.5 md:p-2 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors group/ai relative"
                      aria-label="AI Weekly Report"
                    >
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 text-[6px] text-white items-center justify-center font-bold">AI</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal();
                      }}
                      className="p-1.5 md:p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="View beach details"
                    >
                      <InfoIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Suitability Rating and Conditions */}
              <div className="mt-1 md:mt-3">
                {isLocalLoading || isLoading ? (
                  <ConditionsSkeleton />
                ) : score !== null &&
                  typeof score === "number" &&
                  forecastData ? (
                  // Show actual conditions when we have both score and forecast data
                  <div className="flex flex-col gap-1 md:gap-2">
                    <div className="flex items-center gap-2">
                      <BlueStarRating score={score} />

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
                    <div className="grid grid-cols-1 gap-3 py-3 border-t border-gray-100 mt-3">
                      {getConditionReasons(beach, forecastData, false).optimalConditions.map((condition, idx) => {
                        const [label, value] = condition.text.split(":");
                        return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-200 shrink-0",
                            condition.isMet 
                              ? "border-blue-100 bg-blue-50 text-blue-600 shadow-sm" 
                              : "border-gray-100 bg-gray-50 text-gray-300"
                          )}>
                            {condition.isMet ? (
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="4">
                                <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="4">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 leading-none mb-1">
                              {label}
                            </span>
                            <span className="font-primary text-[12px] font-semibold text-black leading-none truncate">
                              {value}
                            </span>
                          </div>
                        </div>
                        );
                      })}
                    </div>

                    {/* Latest Session Log */}
                    {beachSessions[0] && (
                      <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50/50 -mx-4 px-4 py-3 md:-mx-6 md:px-6 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 leading-none mb-1">
                            LATEST SURF LOG
                          </span>
                          <div className="flex items-center gap-2">
                            <BlueStarRating score={beachSessions[0].surferRating || 0} size={12} />
                            <span className="font-primary text-[11px] font-bold text-gray-400">
                              / 5.0
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-primary text-[12px] font-semibold text-black leading-none mb-1">
                            {format(new Date(beachSessions[0].date), "MMM d")}
                          </div>
                          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 leading-none">
                            DATE
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add the Show/Hide Conditions button here - ALWAYS present */}
                    <div className="flex flex-col gap-1 mt-3">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-white text-gray-900 hover:bg-gray-50 font-semibold text-[11px] tracking-tight shadow-sm transition-all duration-300 w-fit active:scale-95"
                        onClick={() => setShowIdealConditions((v) => !v)}
                        aria-expanded={showIdealConditions}
                        aria-controls={`ideal-conditions-${beach.id}`}
                      >
                        <span className="uppercase tracking-widest text-[9px] text-gray-400">Conditions</span>
                        <span>
                          {showIdealConditions
                            ? "Hide"
                            : "Show"}
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showIdealConditions ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div
                        id={`ideal-conditions-${beach.id}`}
                        className={`transition-all duration-300 overflow-hidden ${showIdealConditions ? "max-h-[500px] mt-2 opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <div className="grid grid-cols-1 gap-3 py-3 border-t border-gray-100">
                          {[
                            { label: "Optimal Wind", value: (beach.optimalWindDirections || []).join(", ") },
                            { label: "Wind Speed", value: "0-25kts" },
                            { label: "Optimal Swell Direction", value: `${beach.optimalSwellDirections?.min || 0}° - ${beach.optimalSwellDirections?.max || 360}°` },
                            { label: "Optimal Wave Size", value: `${beach.swellSize?.min || 0}m - ${beach.swellSize?.max || 10}m` },
                            { label: "Optimal Swell Period", value: `${beach.idealSwellPeriod?.min || 0}s - ${beach.idealSwellPeriod?.max || 25}s` }
                          ].map((item, idx) => (
                            <div key={idx} className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1">
                                {item.label}
                              </span>
                              <span className="font-primary text-[12px] font-semibold text-black">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show optimal conditions when no surf data is available
                  <div className="text-sm flex flex-col gap-1">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-white text-gray-900 hover:bg-gray-50 font-semibold text-[11px] tracking-tight shadow-sm transition-all duration-300 w-fit active:scale-95"
                      onClick={() => setShowIdealConditions((v) => !v)}
                      aria-expanded={showIdealConditions}
                      aria-controls={`ideal-conditions-${beach.id}`}
                    >
                      <span className="uppercase tracking-widest text-[9px] text-gray-400">Conditions</span>
                      <span>
                        {showIdealConditions
                          ? "Hide"
                          : "Show"}
                      </span>
                      <ChevronDown
                        className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showIdealConditions ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      id={`ideal-conditions-${beach.id}`}
                      className={`transition-all duration-300 overflow-hidden ${showIdealConditions ? "max-h-[500px] mt-2 opacity-100" : "max-h-0 opacity-0"}`}
                    >
                      <div className="grid grid-cols-1 gap-3 py-3 border-t border-gray-100">
                        {[
                          { label: "Optimal Wind", value: beach.optimalWindDirections.join(", ") },
                          { label: "Wind Speed", value: "0-25kts" },
                          { label: "Optimal Swell Direction", value: `${beach.optimalSwellDirections.min}° - ${beach.optimalSwellDirections.max}°` },
                          { label: "Optimal Wave Size", value: `${beach.swellSize.min}m - ${beach.swellSize.max}m` },
                          { label: "Optimal Swell Period", value: `${beach.idealSwellPeriod.min}s - ${beach.idealSwellPeriod.max}s` }
                        ].map((item, idx) => (
                          <div key={idx} className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-1">
                              {item.label}
                            </span>
                            <span className="font-primary text-[12px] font-semibold text-black">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Media Grid - Only show if videos exist */}
              {beach.videos && beach.videos.length > 0 && (
                <div className="mt-3 md:mt-4">
                  <ErrorBoundary>
                    <MediaGrid
                      beach={{
                        id: beach.id,
                        name: beach.name,
                        region: {
                          id: beach.regionId,
                          name: beach.region?.name || "",
                          country: beach.country,
                        },
                        logEntries: beach.logEntries,
                      }}
                      videos={beach.videos}
                      isLocked={isLocked}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {/* Wave Type Indicator - Bottom Right */}
              <div className="absolute bottom-3 right-12 md:bottom-4 md:right-14">
                <span className="font-primary text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 bg-gray-50/80 px-2 py-1 rounded-md border border-gray-100/50 backdrop-blur-[2px]">
                  {formatWaveType(beach.waveType)}
                </span>
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

      {/* AI Report Modal */}
      {isAIModalOpen && (
        <AIReportModal
          beach={beach}
          isOpen={isAIModalOpen}
          onClose={handleCloseAIModal}
          date={searchParams.get("date") || new Date().toISOString().split("T")[0]}
          reportId={searchParams.get("report") || undefined}
        />
      )}
    </ErrorBoundary>
  );
});

export default BeachCard;
