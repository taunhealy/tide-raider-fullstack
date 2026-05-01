"use client";

import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Pencil,
  Video as VideoIcon,
  ChevronLeft,
  MapPin,
  Calendar,
  Wind,
  Waves,
  Clock,
  Info as InfoIcon,
  Lock,
  Sparkles,
} from "lucide-react";
import { degreesToCardinal } from "@/app/lib/forecastUtils";
import { cn } from "@/app/lib/utils";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import CommentThread from "@/app/components/comments/CommentThread";
import { Button } from "@/app/components/ui/Button";
import type { Prisma } from "@prisma/client";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { useState } from "react";
import { MediaModal } from "./MediaModal";
import { VideoThumbnail } from "./VideoThumbnail";
import { CustomVideoPlayer } from "./CustomVideoPlayer";
import { ImageGallery } from "./ImageGallery";
import { MultimediaGrid } from "./MultimediaGrid";
import type { VideoPlatform } from "@/app/types/raidlogs";
import { useRaidLog } from "@/app/hooks/useRaidLog";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import ForecastAlertForm from "@/app/components/alerts/ForecastAlertForm";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { RandomLoader } from "../ui/random-loader";
import { useSubscriptionDetails } from "@/app/hooks/useSubscriptionDetails";
import { useBeaches } from "@/app/hooks/useBeaches";
import { SubscriptionStatus } from "@/app/types/subscription";

interface RaidLogDetailsProps {
  id: string;
}

// Instagram-style logger display component
function LoggerDisplay({
  userId,
  userData: entryUserData,
}: {
  userId: string;
  userData?: {
    id: string;
    name: string;
    nationality: string | null;
    image?: string | null;
  } | null;
}) {
  const userData = entryUserData;
  const displayName = userData?.name || "Anonymous";
  const userImage = entryUserData?.image || null;
  const avatarSize = 56;

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/profile/${userId}`}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        {userImage ? (
          <div className="relative w-14 h-14 rounded-full overflow-hidden border border-gray-300">
            <Image
              src={userImage}
              alt={`${displayName}'s avatar`}
              width={avatarSize}
              height={avatarSize}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="bg-[var(--color-tertiary)] rounded-full w-14 h-14 flex items-center justify-center text-white font-semibold text-lg shadow-sm border border-gray-300">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>
      <Link
        href={`/profile/${userId}`}
        className="text-white font-primary font-bold text-sm hover:text-[var(--color-tertiary)] transition-colors"
      >
        {displayName}
      </Link>
    </div>
  );
}

export default function RaidLogDetails({ id }: RaidLogDetailsProps) {
  const { data: session } = useBackendAuth();
  const router = useRouter();
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const { data: entry, isLoading, error } = useRaidLog(id);
  const { data: subscriptionDetails } = useSubscriptionDetails();
  const isSubscribed = subscriptionDetails?.status === SubscriptionStatus.ACTIVE;
  const hasAccess = isSubscribed || subscriptionDetails?.hasActiveTrial;
  
  const { data: beachesData } = useBeaches();
  const beaches = (beachesData as any)?.beaches || beachesData || [];
  
  // Robust check for Hidden Gem status
  const isHiddenGemEntry = !!(entry as any)?.beach?.isHiddenGem || 
                          (Array.isArray(beaches) ? beaches : [])?.find((b: any) => 
                            b && (
                              b.id === (entry as any)?.beachId || 
                              b.id === (entry as any)?.beach?.id || 
                              b.name?.toLowerCase() === (entry as any)?.beachName?.toLowerCase() ||
                              b.name?.toLowerCase() === (entry as any)?.beach?.name?.toLowerCase()
                            )
                          )?.isHiddenGem;

  const isOwner = session?.user?.id === (entry as any)?.userId;

  const isGatedGem = isHiddenGemEntry && !hasAccess && !isOwner;

  const beachId = entry ? (entry as any).beachId || entry.beach?.id : null;
  const logDateRaw = entry?.date ? new Date(entry.date) : null;
  const logDate = logDateRaw && !isNaN(logDateRaw.getTime()) 
    ? logDateRaw.toISOString().split("T")[0]
    : null;

  const { data: beachScores, isLoading: isLoadingBeachScores } = useQuery({
    queryKey: ["beach-scores", beachId, logDate],
    queryFn: async () => {
      if (!beachId || !logDate) return null;

      const response = await fetch(
        `/api/beach-scores?beachId=${beachId}&date=${logDate}`
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!beachId && !!logDate && !!entry,
  });

  const { data: existingAlert } = useQuery({
    queryKey: ["alert-for-log", id, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id || !entry?.id) return null;
      const response = await fetch(`/api/alerts?logEntryId=${entry.id}`);
      if (!response.ok) return null;
      const alerts = await response.json();
      return alerts.length > 0 ? alerts[0] : null;
    },
    enabled: !!session?.user?.id && !!entry?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <RandomLoader isLoading={true} />
      </div>
    );
  }

  if (error || !entry) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load raid log";
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-primary mb-4">{errorMessage}</p>
          <Link
            href="/raidlogs"
            className="text-[var(--color-primary)] hover:text-[var(--color-tertiary-dark)] transition-colors inline-flex items-center gap-2 font-primary"
          >
            <ChevronLeft className="w-4 h-4" /> Back to log book
          </Link>
        </div>
      </div>
    );
  }

  const forecastData = entry.forecast || null;

  // Support both single imageUrl and imageUrls array
  const entryImageUrls = (entry as any)?.imageUrls;
  const imageUrls = Array.isArray(entryImageUrls) && entryImageUrls.length > 0
      ? entryImageUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
      : entry?.imageUrl
        ? [entry.imageUrl]
        : [];

  const entryVideoUrls = (entry as any)?.videoUrls;
  const videoUrls = Array.isArray(entryVideoUrls) && entryVideoUrls.length > 0
    ? entryVideoUrls.filter((v: any) => v && v.url)
    : entry?.videoUrl
      ? [{ url: entry.videoUrl, type: (entry as any).videoPlatform || "upload" }]
      : [];

  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [activeMediaType, setActiveMediaType] = useState<"image" | "video">("image");

  return (
    <div className="min-h-screen bg-gray-950 text-white font-primary selection:bg-[var(--color-tertiary)] selection:text-white">
      {/* Navigation and Actions Bar - Fixed at top */}
      <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link
            href="/raidlogs"
            className="text-white/70 hover:text-[var(--color-tertiary)] transition-all inline-flex items-center gap-2 font-primary text-sm md:text-base group"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Back to log book</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            {!isGatedGem && (
              <Button
                onClick={() => setIsAlertModalOpen(true)}
                variant="action"
                size="sm"
                className="flex items-center gap-2 font-primary text-[10px] md:text-[11px] h-9 px-4 md:px-5 active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {existingAlert ? "Edit Alert" : "Set Alert"}
                </span>
              </Button>
            )}

            {isOwner && (
              <Button
                onClick={() => router.push(`/raidlogs/${entry.id}/edit`)}
                variant="dark"
                size="sm"
                className="flex items-center gap-2 font-primary text-[10px] md:text-[11px] h-9 px-4 md:px-5 border-white/10 hover:bg-white/5 active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Log</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="bg-brand-dark rounded-3xl overflow-hidden border border-white/10 ring-1 ring-white/5 shadow-2xl">
              {/* Content Grid */}
              <div className="grid lg:grid-cols-3 gap-8 md:gap-12 p-6 md:p-10 relative">
                {isGatedGem && (
                  <div className="absolute inset-0 z-30 flex items-start justify-center pointer-events-none p-10 pt-24 md:pt-32">
                    <div className="bg-amber-500/95 text-white px-8 py-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-amber-400/50 backdrop-blur-md flex flex-col items-center gap-3 pointer-events-auto max-w-sm text-center transform transition-all hover:scale-105">
                      <Lock className="w-8 h-8 mb-2" />
                      <h4 className="font-primary font-black uppercase tracking-widest text-sm">Premium Intelligence Locked</h4>
                      <p className="text-xs font-medium opacity-90 mb-4">Subscribe to unlock Hidden Gem locations and community data.</p>
                      <Button 
                        size="sm" 
                        variant="dark" 
                        className="bg-black/40 hover:bg-black/60 border-white/20 w-full"
                        onClick={() => router.push("/pricing")}
                      >
                        Unlock Now
                      </Button>
                    </div>
                  </div>
                )}
                <div className="lg:col-span-3 space-y-4 md:space-y-6">
                  {/* Header with Beach and Rating */}
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-wrap items-baseline gap-4">
                      <h1 className={cn("text-3xl md:text-4xl lg:text-5xl font-primary font-bold text-white tracking-tighter", isGatedGem && "blur-[12px] select-none")}>
                        {isGatedGem ? "Hidden Gem Break" : (entry.beach?.name || entry.beachName || "Unnamed Beach")}
                      </h1>
                      {Number(entry.surferRating) > 3 && !isGatedGem && (
                        <span className="bg-[var(--color-tertiary)]/20 text-[var(--color-tertiary)] text-[10px] px-3 py-1 rounded-full font-primary font-bold tracking-wider border border-[var(--color-tertiary)]/30">
                          Top Rated
                        </span>
                      )}
                    </div>

                    <div className={cn("flex items-center gap-2 text-white/50 font-primary text-sm md:text-base", isGatedGem && "blur-[10px] select-none opacity-40")}>
                      <MapPin className="w-4 h-4 flex-shrink-0 text-[var(--color-tertiary)]" />
                      <p className="truncate">
                        {isGatedGem ? "Region Redacted" : (entry.region?.name
                          ? `${entry.region.name}${entry.region.country ? `, ${entry.region.country.name}` : ""}`
                          : "No location specified")}
                      </p>
                    </div>

                    {/* Logger Info */}
                    <div className={cn("space-y-3 pt-4", isGatedGem && "blur-[10px] select-none opacity-40")}>
                      <h2 className="font-primary text-[10px] text-white/40 font-bold tracking-widest">
                        Logger
                      </h2>
                      {isGatedGem ? (
                        <div className="flex items-center gap-3">
                           <div className="bg-gray-800 rounded-full w-14 h-14 flex items-center justify-center text-gray-600 font-black text-xl shadow-lg border border-gray-700">
                             ?
                           </div>
                           <p className="text-white/40 font-primary font-black text-sm uppercase tracking-wider italic">
                             REDACTED
                           </p>
                        </div>
                      ) : entry.isAnonymous ? (
                        <div className="flex items-center gap-3">
                          <div className="bg-[var(--color-tertiary)]/20 rounded-full w-14 h-14 flex items-center justify-center text-[var(--color-tertiary)] font-black text-xl shadow-lg border border-[var(--color-tertiary)]/30">
                            A
                          </div>
                          <p className="text-white font-primary font-black text-sm uppercase tracking-wider">
                            Anonymous
                          </p>
                        </div>
                      ) : entry.userId ? (
                        <LoggerDisplay
                          userId={entry.userId}
                          userData={entry.user}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="bg-[var(--color-tertiary)]/20 rounded-full w-14 h-14 flex items-center justify-center text-[var(--color-tertiary)] font-black text-xl shadow-lg border border-[var(--color-tertiary)]/30 flex-shrink-0">
                            A
                          </div>
                          <p className="text-white font-primary font-black text-sm uppercase tracking-wider">
                            {entry.surferName || "Anonymous"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className={cn("space-y-3 pt-4", isGatedGem && "blur-[10px] select-none opacity-40")}>
                      <h2 className="font-primary text-[10px] text-white/40 font-bold tracking-widest">
                        Surf session rating
                      </h2>
                      <div className="flex items-center gap-3">
                        <BlueStarRating
                          score={isGatedGem ? 0 : Number(entry.surferRating || 0)}
                          outOfFive={true}
                        />
                      </div>
                    </div>

                    {/* Multimedia Section - Unified Grid with Hero */}
                    <div className={cn("space-y-12 pt-10", isGatedGem && "blur-[15px] select-none opacity-30")}>
                      {(imageUrls.length > 0 || videoUrls.length > 0) && (
                        <div className="w-full">
                          <h2 className="font-primary text-[10px] text-white/40 font-bold tracking-widest mb-6 uppercase">
                            Session Gallery
                          </h2>
                          <div className={cn(isGatedGem && "blur-[20px] select-none opacity-40 pointer-events-none")}>
                            <MultimediaGrid
                              images={imageUrls}
                              videos={videoUrls}
                              onMediaClick={(type, index) => {
                                if (type === "image") {
                                  setSelectedImageIndex(index);
                                  setActiveMediaType("image");
                                } else {
                                  setSelectedVideoIndex(index);
                                  setActiveMediaType("video");
                                }
                                setIsMediaModalOpen(true);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="font-primary text-xl lg:text-2xl font-bold text-white tracking-tighter">
                            Conditions Data
                          </h2>
                        </div>
                        
                        <div className="space-y-12">
                          {[
                            { id: "MORNING", label: "Morning" },
                            { id: "NOON", label: "Noon" },
                            { id: "EVENING", label: "Eve" }
                          ].map((slot) => {
                            const apiScores = beachScores?.scores?.filter((score: any) => {
                              const conditions = score.conditions || (score.source === 'WINDFINDER' ? forecastData : null);
                              return conditions?.timeSlot === slot.id;
                            }) || [];

                            // If this slot matches the entry's timeSlot and we have forecast data, 
                            // and there's no matching source in apiScores, add it as a 'Reported' source
                            const slotScores = [...(apiScores || [])];
                            const entryTimeSlot = entry.timeSlot || (entry as any).forecast?.timeSlot;
                            
                            if (entryTimeSlot === slot.id && forecastData && !slotScores.some(s => s.source === 'REPORTER')) {
                              slotScores.push({
                                source: 'REPORTER',
                                sourceName: 'Source A',
                                starRating: entry.surferRating || 0,
                                conditions: forecastData
                              });
                            }

                            return (
                              <div key={slot.id} className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="h-px flex-1 bg-white/5"></div>
                                  <div className="flex items-center gap-2 bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-lg">
                                    <Clock className="w-4 h-4 text-[var(--color-tertiary)]" />
                                    <span className="text-xs font-bold text-white uppercase tracking-[0.2em]">
                                      {slot.label}
                                    </span>
                                  </div>
                                  <div className="h-px flex-1 bg-white/5"></div>
                                </div>

                                {isLoadingBeachScores ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                      <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 animate-pulse space-y-4">
                                        <div className="h-4 w-24 bg-white/10 rounded"></div>
                                        <div className="space-y-3">
                                          <div className="h-10 bg-white/5 rounded-xl"></div>
                                          <div className="h-10 bg-white/5 rounded-xl"></div>
                                          <div className="h-10 bg-white/5 rounded-xl"></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : slotScores.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {slotScores.map((score: any, index: number) => {
                                      const conditions = score.conditions || (score.source === 'WINDFINDER' || score.source === 'REPORTER' ? forecastData : null);
                                      if (!conditions) return null;
                                      
                                      return (
                                        <div key={`${score.source}-${index}`} className="bg-white/5 border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/10 hover:border-white/10 group/card relative overflow-hidden">
                                          {/* Active Indicator if this matches the log entry slot */}
                                          {entryTimeSlot === slot.id && (
                                            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-tertiary)] opacity-50"></div>
                                          )}
                                          
                                          <div className="flex items-center justify-between mb-6">
                                            <div className="space-y-1">
                                              <h3 className="font-primary text-[10px] font-bold text-white/40 tracking-widest">
                                                {score.sourceName}
                                              </h3>
                                              <p className="text-[9px] font-bold text-[var(--color-tertiary)] uppercase tracking-tighter">
                                                {slot.label}
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 translate-y-[-2px]">
                                              <BlueStarRating score={score.starRating} outOfFive={true} size={12} />
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                              <div className="w-8 h-8 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center flex-shrink-0">
                                                <Wind className="w-4 h-4 text-[var(--color-tertiary)]" />
                                              </div>
                                              <div>
                                                <p className="text-[8px] font-bold text-white/30 tracking-widest mb-0.5">Wind</p>
                                                <p className="text-xs font-black text-white">
                                                  {conditions.windSpeed != null ? `${conditions.windSpeed}kts` : "N/A"}
                                                  {conditions.windDirection != null && (
                                                    <span className="text-white/40 font-bold ml-1 tracking-tighter">
                                                      {degreesToCardinal(conditions.windDirection)}
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                              <div className="w-8 h-8 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center flex-shrink-0">
                                                <Waves className="w-4 h-4 text-[var(--color-tertiary)]" />
                                              </div>
                                              <div>
                                                <p className="text-[8px] font-bold text-white/30 tracking-widest mb-0.5">Swell</p>
                                                <p className="text-xs font-black text-white">
                                                  {conditions.swellHeight != null ? `${Number(conditions.swellHeight).toFixed(1)}m` : "N/A"}
                                                  {conditions.swellDirection != null && (
                                                    <span className="text-white/40 font-bold ml-1 tracking-tighter">
                                                      {degreesToCardinal(conditions.swellDirection)} ({Math.round(conditions.swellDirection)}°)
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                              <div className="w-8 h-8 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-4 h-4 text-[var(--color-tertiary)]" />
                                              </div>
                                              <div>
                                                <p className="text-[8px] font-bold text-white/30 tracking-widest mb-0.5">Period</p>
                                                <p className="text-xs font-black text-white">{conditions.swellPeriod != null ? `${conditions.swellPeriod}s` : "N/A"}</p>
                                              </div>
                                            </div>

                                            {conditions.tide && (
                                              <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                                <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center flex-shrink-0">
                                                  <Waves className="w-4 h-4 text-cyan-400" />
                                                </div>
                                                <div className="overflow-hidden">
                                                  <p className="text-[8px] font-bold text-cyan-400/40 tracking-widest mb-0.5">Tide</p>
                                                  <p className="text-[10px] font-black text-white truncate">{conditions.tide}</p>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                      <InfoIcon className="w-5 h-5 text-white/20" />
                                    </div>
                                    <span className="text-xs font-bold text-white/20 uppercase tracking-widest">No conditions data available for {slot.label}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>

              {/* Session Date */}
              <div className="px-6 md:px-10 pb-6">
                <div className="bg-white/5 rounded-2xl p-5 md:p-6 flex items-center gap-4 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--color-tertiary)]/10 flex items-center justify-center border border-[var(--color-tertiary)]/20 shadow-lg">
                    <Calendar className="w-6 h-6 md:w-7 md:h-7 text-[var(--color-tertiary)]" />
                  </div>
                  <div>
                    <h2 className="font-primary text-[10px] font-bold text-white/40 tracking-widest mb-1">
                      Session date
                    </h2>
                    <p className={cn("text-white font-primary font-black text-lg md:text-xl uppercase tracking-tighter", isGatedGem && "blur-[10px] select-none opacity-40")}>
                      {isGatedGem ? "Redacted Date" : (() => {
                        try {
                          if (!entry.date) return "Date Unknown";
                          const date = new Date(entry.date);
                          if (isNaN(date.getTime())) return "Date Unknown";
                          // Adjusted date to account for timezone to show the correct day
                          const adjustedDate = new Date(date.getTime() + (new Date().getTimezoneOffset() * 60000));
                          return format(adjustedDate, "MMMM d, yyyy");
                        } catch (e) {
                          return "Date Unknown";
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {entry.comments && (
                <div className="px-6 md:px-10 pb-10">
                  <div className="space-y-4 pt-4">
                    <h2 className="font-primary text-[10px] font-bold text-white/40 tracking-widest">
                      Logger comments
                    </h2>
                    <div className={cn("bg-white/5 rounded-2xl p-6 md:p-8 border-l-4 border-[var(--color-tertiary)] border border-white/5 shadow-2xl relative overflow-hidden", isGatedGem && "blur-[10px] select-none opacity-40")}>
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <svg className="w-12 h-12 text-[var(--color-tertiary)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM5.017 21V18C5.017 16.8954 5.91243 16 7.017 16H10.017C11.1216 16 12.017 16.8954 12.017 18V21C12.017 22.1046 11.1216 23 10.017 23H7.017C5.91243 23 5.017 22.1046 5.017 21ZM19.017 13C17.9124 13 17.017 12.1046 17.017 11V5C17.017 3.89543 17.9124 3 19.017 3H21.017C22.1216 3 23.017 3.89543 23.017 5V11C23.017 12.1046 22.1216 13 21.017 13H19.017ZM10.017 13C8.91243 13 8.017 12.1046 8.017 11V5C8.017 3.89543 8.91243 3 10.017 3H12.017C13.1216 3 14.017 3.89543 14.017 5V11C14.017 12.1046 13.1216 13 12.017 13H10.017Z" />
                        </svg>
                      </div>
                      <p className="text-white/80 font-primary text-base md:text-lg leading-relaxed whitespace-pre-wrap relative z-10 italic">
                        {isGatedGem ? "Community intelligence redacted. Subscribe to unlock session comments." : `"${entry.comments}"`}
                      </p>
                    </div>
                  </div>
                </div>
              )}


              {/* User Comments Section */}
              <div className="border-t border-white/5 p-8 md:p-12 lg:p-16 bg-black/40">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="font-primary text-2xl md:text-3xl font-bold text-white tracking-tighter">
                    Discussion
                  </h2>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <div className="text-white">
                  <CommentThread logEntryId={entry.id} />
                </div>
              </div>
          </div>
        </div>

      {/* Media Modal */}
      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        imageUrls={imageUrls}
        videoUrls={videoUrls}
        initialImageIndex={selectedImageIndex}
        initialVideoIndex={selectedVideoIndex}
        initialType={activeMediaType}
      />

      {/* Alert Modal */}
      <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          <ForecastAlertForm
            logEntry={entry}
            existingAlert={existingAlert}
            onClose={() => setIsAlertModalOpen(false)}
            onSaved={() => setIsAlertModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
