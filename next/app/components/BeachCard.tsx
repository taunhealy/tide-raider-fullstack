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
  Sparkles, 
  Play, 
  ArrowUpRight, 
  Wind, 
  Droplets, 
  MapPin, 
  Gem,
  Check
} from "lucide-react";
import AIReportModal from "./beach/AIReportModal";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import GoogleMapsButton from "@/app/components/GoogleMapsButton";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
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
import { useSearchTracking } from "@/app/hooks/useSearchTracking";


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
  scoreInsights?: string[];
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
  isLoading = false,
  distance,
  scoreInsights,
}: BeachCardProps) {
  if (!beach) return null;

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

  // Hidden gems are locked for non-premium users
  // We only lock if we're NOT loading the subscription status and we're sure they're not premium
  const isLocked = !!beach.isHiddenGem && !directIsPremium && !isSubscriptionLoading;

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
  const beachSessions = (beach as any).logEntries || [];

  const renderRating = () => {
    // Convert 0-10 score to 1-5 star rating consistent with backend logic
    const starsToFill = Math.round((score || 0) / 2);
    
    return (
      <div className="flex items-center gap-2">
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
        {(beach.hasAIReport || beach.hasFreshIntel) && (
          <div 
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-md border",
              beach.hasRecentAIReport 
                ? "bg-indigo-50 text-indigo-500 border-indigo-100 shadow-[0_0_10px_-2px_rgba(79,70,229,0.3)] animate-pulse"
                : "bg-gray-50 text-gray-400 border-gray-100"
            )}
            title={beach.hasRecentAIReport ? "Recent Strategic Intel Available" : "Historical Intel Available in Archive"}
          >
            <Sparkles className={cn("w-2.5 h-2.5", beach.hasRecentAIReport ? "fill-indigo-500/20 text-indigo-500" : "text-gray-500")} />
            <span className="text-[8px] font-black uppercase tracking-tighter">
              {beach.hasRecentAIReport ? "Intel" : "Archive"}
            </span>
          </div>
        )}
      </div>
    );
  };

  const isModalOpen = searchParams.get("beach") === beach.name;

  const { trackBeach } = useSearchTracking();

  // Auto-open AI modal if deep-linked via URL (report history)
  useEffect(() => {
    const reportId = searchParams.get("report");
    const reportBeachId = searchParams.get("beachId");
    
    // Support matching by ID (from history page) or Name (from regular UI)
    if (reportId && (reportBeachId === beach.id || searchParams.get("beachName") === beach.name)) {
      setIsAIModalOpen(true);
      trackBeach(beach.id);
    }
  }, [searchParams, beach.id, beach.name, trackBeach]);

  const handleOpenAIModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsAIModalOpen(true);
    trackBeach(beach.id);
  };


  const handleOpenModal = (e?: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e?.stopPropagation();
    const params = new URLSearchParams(searchParams);
    params.set("beach", beach.name);
    trackBeach(beach.id);
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
        onClick={isLocked ? () => router.push('/pricing') : undefined}
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
        ${isLocked ? "cursor-pointer" : ""}
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
                      <span 
                        title={isLocked ? "Unlock this Hidden Gem by becoming a Premium member" : undefined}
                      >
                        <span className={cn(isLocked && "blur-[8px] select-none pointer-events-none opacity-80")}>
                          {beach.name}
                        </span>
                      </span>
                      {beach.isHiddenGem && (
                        <span className={cn(
                          "inline-flex items-center px-1.5 py-0 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all duration-300 h-4 md:h-[18px]",
                          isLocked 
                            ? "bg-blue-50 text-black border-blue-100" 
                            : "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-[0_0_10px_-2px_rgba(79,70,229,0.2)]"
                        )}>
                          <Gem className={cn("w-2 h-2 mr-1", !isLocked ? "fill-indigo-600/20" : "text-[#1d4ed8]")} />
                          Hidden Gem
                        </span>
                      )}
                      {forecastData?.windSpeed &&
                        forecastData.windSpeed > 25 && (
                          <span title="Strong winds">🌪️</span>
                        )}
                      {beach.sharkAttack?.hasAttack && (
                        <span title="At least 1 shark attack reported">
                          {beach.sharkAttack?.incidents?.filter(Boolean).some(
                            (incident: any) =>
                              incident.date && new Date(incident.date).getTime() >
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
                          <span className={cn("font-primary text-[11px] leading-[16px] font-medium tracking-tight text-gray-500", isLocked && "blur-[4px] select-none")}>
                            {isLocked ? "Top Secret Location" : beach.location}
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
                      <span className={cn("font-primary text-[12px] leading-[16px] font-semibold tracking-[-0.3px] text-black", isLocked && "blur-[4px] select-none")}>
                        {isLocked ? "Secret Region" : formatRegionName(beach.region?.name, beach.regionId)}
                      </span>
                    </h6>

                    {/* Most Accurate Source Indicator */}
                    {!isLocked && beach.mostAccurateSource && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            Verified Source: {
                              beach.mostAccurateSource === "WINDFINDER" ? "Alpha" :
                              beach.mostAccurateSource === "WINDGURU" ? "Beta" :
                              beach.mostAccurateSource === "WINDY" ? "Gamma" :
                              beach.mostAccurateSource === "TIDE_RAIDER" ? "Delta" :
                              beach.mostAccurateSource
                            }
                          </span>
                        </div>
                        {beach.sourceAccuracyCount && beach.sourceAccuracyCount > 0 && (
                          <span className="text-[9px] font-bold text-gray-400">
                            ({beach.sourceAccuracyCount} logs)
                          </span>
                        )}
                      </div>
                    )}
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
                      className="flex"
                    />
                    <button
                      type="button"
                      onClick={handleOpenAIModal}
                      className={cn(
                        "p-1.5 md:p-2 rounded-full transition-all group/ai relative",
                        beach.hasRecentAIReport 
                          ? "bg-indigo-50 hover:bg-indigo-100 shadow-lg shadow-indigo-500/10"
                          : "bg-gray-50 hover:bg-gray-100 grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
                      )}
                      title={beach.hasRecentAIReport ? "Recent Strategic Intel Available" : "Open Intelligence Terminal"}
                    >
                      <Sparkles className={cn("w-4 h-4 md:w-5 md:h-5", beach.hasRecentAIReport ? "text-indigo-400" : "text-gray-500")} />
                      
                      {beach.hasRecentAIReport && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-indigo-400"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 text-[6px] text-white items-center justify-center font-bold bg-indigo-500">AI</span>
                        </span>
                      )}
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
                      <div className={cn(isLocked && "blur-[8px] opacity-30 select-none")}>
                        <BlueStarRating score={isLocked ? 0 : score} />
                      </div>

                      <div
                        className={cn(
                          "flex items-center gap-2 relative px-2.5 py-1.5 border border-gray-100 rounded-xl bg-white shadow-sm",
                          isLocked && "blur-[6px] opacity-30 select-none"
                        )}
                        onMouseEnter={isLocked ? undefined : () => setShowRatingHint(true)}
                        onMouseLeave={isLocked ? undefined : () => setShowRatingHint(false)}
                      >
                        <div className="text-base">{isLocked ? "🔒" : scoreDisplay.emoji}</div>

                        {!isLocked && (
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
                        )}
                      </div>
                    </div>

                    {/* Score Insights (Deductions) */}
                    {scoreInsights && scoreInsights.length > 0 && (
                      <div className={cn("flex flex-col gap-1.5 mt-1 mb-2 px-1", isLocked && "blur-[6px] opacity-30 select-none")}>
                        {scoreInsights.map((insight, i) => (
                          <div key={i} className="flex items-center gap-2 group/insight animate-in fade-in slide-in-from-left-2 duration-500">
                            <div className="w-1 h-3 rounded-full bg-red-400/30 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">
                              {isLocked ? "TOP SECRET INSIGHT" : insight}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Latest Session Log - Featured Card Style */}
                    {beachSessions[0] && (
                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Latest Surf Log</h4>
                          <span className="text-[10px] font-bold text-brand-3/60">
                            {(() => {
                              try {
                                const d = new Date(beachSessions[0].date);
                                return !isNaN(d.getTime()) ? format(d, "MMM d") : "Recently";
                              } catch (e) {
                                return "Recently";
                              }
                            })()}
                          </span>
                        </div>

                        <Link 
                          href={`/raidlogs/${beachSessions[0].id}`}
                          className="group/log block relative overflow-hidden bg-brand-3/[0.07] border border-brand-3/20 rounded-2xl shadow-sm transition-all duration-500 hover:shadow-md hover:border-brand-3/40 hover:-translate-y-0.5 active:scale-[0.98]"
                        >
                          <div className="flex p-3 gap-3">
                            {/* Log Thumbnail */}
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                              {beachSessions[0].videoUrl ? (
                                <>
                                  <Image
                                    src={beachSessions[0].videoUrls?.[0]?.thumbnail || getVideoThumbnail(beachSessions[0].videoUrl, beachSessions[0].videoPlatform || "youtube")}
                                    alt=""
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover/log:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                      <Play className="w-2.5 h-2.5 text-brand-3 fill-brand-3 ml-0.5" />
                                    </div>
                                  </div>
                                </>
                              ) : beachSessions[0].imageUrl ? (
                                <Image
                                  src={beachSessions[0].imageUrl}
                                  alt=""
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover/log:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                                  <Sparkles className="w-6 h-6" />
                                </div>
                              )}
                            </div>

                            {/* Log Content Summary */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="flex items-center gap-2 mb-1">
                                <BlueStarRating score={beachSessions[0].surferRating || 0} size={10} outOfFive={true} />
                                <span className="text-[10px] font-bold text-slate-400">/ 5.0</span>
                              </div>
                              
                              <div className="text-[11px] font-black text-slate-900 uppercase truncate mb-1">
                                {beachSessions[0].surferName || "Tide Raider"}
                              </div>

                              {beachSessions[0].comments && (
                                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed italic">
                                  "{beachSessions[0].comments}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-center self-center pl-1 text-slate-300 group-hover/log:text-brand-3 transition-colors">
                               <ArrowUpRight className="w-4 h-4 transform group-hover/log:translate-x-0.5 group-hover/log:-translate-y-0.5 transition-transform" />
                            </div>
                          </div>

                          {/* Mini Conditions Bar if available */}
                          {beachSessions[0].forecast && (
                            <div className="flex items-center gap-4 px-3 py-2 bg-slate-50/50 border-t border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <Wind className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[9px] font-black text-slate-600">
                                  {Math.round(beachSessions[0].forecast.windSpeed)}<span className="text-slate-400">kts</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Droplets className="w-2.5 h-2.5 text-slate-400" />
                                <span className="text-[9px] font-black text-slate-600">
                                  {beachSessions[0].forecast.swellHeight.toFixed(1)}<span className="text-slate-400">m</span> @ {Math.round(beachSessions[0].forecast.swellPeriod)}s
                                </span>
                              </div>
                            </div>
                          )}
                        </Link>
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
                          {getConditionReasons(beach, forecastData, false).optimalConditions?.filter(Boolean).map((condition, idx) => {
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
                      <span 
                        title={isLocked ? "Unlock this Hidden Gem by becoming a Premium member" : undefined}
                      >
                        <span className={cn(isLocked && "blur-[8px] select-none pointer-events-none opacity-80")}>
                          {beach.name}
                        </span>
                      </span>
                      {beach.isHiddenGem && (
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                          isLocked 
                            ? "bg-blue-50 text-[#1d4ed8] border-blue-100" 
                            : "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-[0_0_10px_-2px_rgba(79,70,229,0.2)]"
                        )}>
                          <Gem className={cn("w-2.5 h-2.5 mr-1.5", !isLocked ? "fill-indigo-600/20" : "text-[#1d4ed8]")} />
                          Hidden Gem
                        </span>
                      )}
                      {forecastData?.windSpeed &&
                        forecastData.windSpeed > 25 && (
                          <span title="Strong winds">🌪️</span>
                        )}
                      {beach.sharkAttack?.hasAttack && (
                        <span title="At least 1 shark attack reported">
                          {beach.sharkAttack?.incidents?.some(
                            (incident: any) =>
                              incident?.date && new Date(incident.date).getTime() >
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
                          <span className={cn("font-primary text-[11px] leading-[16px] font-medium tracking-tight text-gray-500", isLocked && "blur-[4px] select-none")}>
                            {isLocked ? "Secret Location" : beach.location}
                          </span>
                          <span className="opacity-20 text-[8px] mt-0.5">•</span>
                        </>
                      )}
                      <span className={cn("font-primary text-[12px] leading-[16px] font-semibold tracking-[-0.3px] text-black", isLocked && "blur-[4px] select-none")}>
                        {isLocked ? "Secret Region" : formatRegionName(beach.region?.name, beach.regionId)}
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
                      className="flex"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAIModalOpen(true);
                      }}
                      className={cn(
                        "p-1.5 md:p-2 rounded-full transition-colors group/ai relative",
                        beach.hasFreshIntel 
                          ? "bg-purple-50 hover:bg-purple-100" 
                          : "bg-blue-50 hover:bg-blue-100"
                      )}
                      title={beach.hasFreshIntel ? "Community Intel Available for this week" : "AI Weekly Report"}
                    >
                      <Sparkles className={cn("w-4 h-4 md:w-5 md:h-5", beach.hasFreshIntel ? "text-purple-600" : "text-blue-600")} />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          beach.hasFreshIntel ? "bg-purple-400" : "bg-blue-400"
                        )}></span>
                        <span className={cn(
                          "relative inline-flex rounded-full h-3 w-3 text-[6px] text-white items-center justify-center font-bold",
                          beach.hasFreshIntel ? "bg-purple-500" : "bg-blue-500"
                        )}>AI</span>
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
                      {getConditionReasons(beach, forecastData, false).optimalConditions?.filter(Boolean).map((condition, idx) => {
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
