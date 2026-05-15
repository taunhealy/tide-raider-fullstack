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
  Sun,
  Moon,
} from "lucide-react";
import { degreesToCardinal, getSourceName } from "@/app/lib/forecastUtils";
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
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [activeMediaType, setActiveMediaType] = useState<"image" | "video">("image");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const { data: entry, isLoading, error } = useRaidLog(id);
  const { data: subscriptionDetails } = useSubscriptionDetails();
  const isSubscribed = subscriptionDetails?.status === SubscriptionStatus.ACTIVE;
  const hasAccess = isSubscribed || subscriptionDetails?.hasActiveTrial;
  
  const isHiddenGemEntry = !!(entry as any)?.beach?.isHiddenGem;

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
      const data = await response.json();
      console.log("[RaidLogDetails] Beach Scores Data:", {
        beachId,
        date: logDate,
        scoresCount: data?.scores?.length,
        sources: data?.scores?.map((s: any) => s.source)
      });
      return data;
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



  return (
    <div className="min-h-screen bg-gray-950 text-white font-primary selection:bg-[var(--color-tertiary)] selection:text-white">
      {/* Navigation and Actions Bar - Fixed at top */}
      <div className="sticky top-[80px] z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3 md:py-4">
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
              <div className="grid lg:grid-cols-3 gap-10 p-5 md:p-10 relative">
                {isGatedGem && (
                  <div className="absolute inset-0 z-30 flex items-start justify-center pointer-events-none p-10 pt-24 md:pt-32">
                    <div className="bg-slate-900/90 text-white px-8 py-10 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-2xl flex flex-col items-center gap-4 pointer-events-auto max-w-[340px] text-center transform transition-all hover:scale-[1.02]">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--color-tertiary)]/10 flex items-center justify-center mb-2 border border-[var(--color-tertiary)]/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                        <Lock className="w-7 h-7 text-[var(--color-tertiary)]" />
                      </div>
                      <h4 className="font-primary font-black uppercase tracking-[0.2em] text-sm text-white">Premium Intelligence Locked</h4>
                      <p className="text-[11px] font-medium text-slate-400 leading-relaxed mb-4 px-4">Subscribe to unlock Hidden Gem locations, exact coordinates, and community data.</p>
                      <Button 
                        size="lg" 
                        className="bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary)]/90 text-white font-black uppercase tracking-[0.15em] text-[10px] w-full rounded-2xl h-12 shadow-lg shadow-[var(--color-tertiary)]/20 active:scale-95 transition-all"
                        onClick={() => router.push("/pricing")}
                      >
                        Initialize Subscription
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
                      {entry.mostAccurateSource && !isGatedGem && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-primary font-bold tracking-wider border border-emerald-500/30">
                          {getSourceName(entry.mostAccurateSource)} Selected
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
                      <h2 className="text-xs text-white font-black uppercase tracking-[0.2em]">
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
                      <h2 className="text-xs text-white font-black uppercase tracking-[0.2em]">
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
                          <h2 className="text-xs text-white font-black uppercase tracking-[0.2em] mb-6">
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                          <h2 className="font-primary text-2xl lg:text-3xl font-bold text-white tracking-tighter">
                            Forecast Reliability
                          </h2>
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 w-fit">
                            <Sparkles className="w-3.5 h-3.5 text-[var(--color-tertiary)]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Crowdsourced Intelligence</span>
                          </div>
                        </div>
                        
                        <div className="space-y-16">
                          {[
                            { id: "MORNING", label: "Morning", icon: <Clock className="w-4 h-4 text-blue-400" /> },
                            { id: "NOON", label: "Midday", icon: <Sun className="w-4 h-4 text-amber-400" /> },
                            { id: "EVENING", label: "Evening", icon: <Moon className="w-4 h-4 text-indigo-400" /> }
                          ].map((slot) => {
                            const apiScores = beachScores?.scores?.filter((score: any) => {
                              return score.timeSlot === slot.id;
                            }) || [];

                            const sources = [
                              { id: 'WINDFINDER', name: getSourceName('WINDFINDER'), color: 'text-blue-400' },
                              { id: 'WINDFINDER_SUPER', name: getSourceName('WINDFINDER_SUPER'), color: 'text-sky-400' },
                              { id: 'WINDGURU', name: getSourceName('WINDGURU'), color: 'text-emerald-400' },
                              { id: 'WINDY', name: getSourceName('WINDY'), color: 'text-red-400' },
                              { id: 'TIDE_RAIDER', name: getSourceName('TIDE_RAIDER'), color: 'text-[var(--color-tertiary)]' },
                              { id: 'OPENMETEO_ARCHIVE', name: getSourceName('OPENMETEO_ARCHIVE'), color: 'text-gray-400' }
                            ].sort((a, b) => {
                              // Prioritize sources that actually have data in apiScores
                              const aHasData = apiScores.some((s: any) => s.source === a.id);
                              const bHasData = apiScores.some((s: any) => s.source === b.id);
                              if (aHasData && !bHasData) return -1;
                              if (!aHasData && bHasData) return 1;
                              return 0;
                            });

                            // For historical logs (> 3 days old), if we have archive data, 
                            // hide the other sources that have no data to reduce clutter.
                            const isOldLog = logDateRaw && (new Date().getTime() - logDateRaw.getTime() > 3 * 24 * 60 * 60 * 1000);
                            const hasArchive = apiScores.some((s: any) => s.source === 'OPENMETEO_ARCHIVE');
                            
                            const filteredSources = isOldLog && hasArchive 
                              ? sources.filter(s => apiScores.some((score: any) => score.source === s.id) || s.id === 'OPENMETEO_ARCHIVE')
                              : sources;

                            // Check if this slot is the one the user actually surfed
                            const entryTimeSlot = (entry as any).surfTimeSlot || entry.timeSlot;
                            const isSessionalSlot = entryTimeSlot === slot.id;

                            return (
                              <div key={slot.id} className="space-y-6">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-3 bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
                                    {slot.icon}
                                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
                                      {slot.label}
                                    </span>
                                    {isSessionalSlot && (
                                      <span className="ml-2 bg-[var(--color-tertiary)]/20 text-[var(--color-tertiary)] text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter border border-[var(--color-tertiary)]/30">
                                        Your Session
                                      </span>
                                    )}
                                  </div>
                                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                                </div>

                                {isLoadingBeachScores ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {[1, 2, 3].map((i) => (
                                      <div key={i} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 animate-pulse space-y-4">
                                        <div className="h-4 w-24 bg-white/10 rounded-full"></div>
                                        <div className="space-y-3">
                                          <div className="h-12 bg-white/5 rounded-2xl"></div>
                                          <div className="h-12 bg-white/5 rounded-2xl"></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {filteredSources.map((sourceInfo) => {
                                      const score = apiScores.find((s: any) => s.source === sourceInfo.id);
                                      let conditions = score?.conditions;
                                      
                                      // Fallback for the source the user actually used for this session
                                      if (entry.mostAccurateSource === sourceInfo.id && isSessionalSlot && !conditions) {
                                        conditions = forecastData;
                                      }

                                      const isMostAccurate = isSessionalSlot && entry.mostAccurateSource === sourceInfo.id;
                                      
                                      if (!conditions) {
                                        return (
                                          <div key={sourceInfo.id} className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[160px] opacity-40">
                                            <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", sourceInfo.color)}>{sourceInfo.name}</span>
                                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">No Forecast Data</span>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div 
                                          key={sourceInfo.id} 
                                          className={cn(
                                            "group/card relative overflow-hidden rounded-3xl border transition-all duration-500",
                                            isMostAccurate 
                                              ? "bg-[var(--color-tertiary)]/[0.08] border-[var(--color-tertiary)]/40 shadow-[0_0_40px_rgba(var(--color-tertiary-rgb),0.15)] ring-1 ring-[var(--color-tertiary)]/30" 
                                              : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                                          )}
                                        >
                                          {/* Decorative Background Elements */}
                                          {isMostAccurate && (
                                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[var(--color-tertiary)]/10 blur-3xl rounded-full"></div>
                                          )}
                                          
                                          <div className="p-6 space-y-5">
                                            <div className="flex items-center justify-between">
                                              <div className="space-y-1">
                                                <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", sourceInfo.color)}>
                                                  {sourceInfo.name}
                                                </h3>
                                              </div>
                                              <div className="flex flex-col items-end gap-2">
                                                <BlueStarRating score={score?.starRating || 0} outOfFive={true} size={10} />
                                              </div>
                                            </div>

                                            {isMostAccurate && (
                                              <div className="bg-[var(--color-tertiary)] text-white text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-[var(--color-tertiary)]/20 animate-in fade-in zoom-in duration-500">
                                                MOST ACCURATE
                                              </div>
                                            )}
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 group-hover/card:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Wind className="w-3.5 h-3.5 text-[var(--color-tertiary)]" />
                                                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Wind</span>
                                                </div>
                                                <p className="text-xs font-black text-white">
                                                  {conditions.windSpeed != null ? `${conditions.windSpeed}kts` : "--"}
                                                  {conditions.windDirection != null && (
                                                    <span className="text-[10px] text-white/40 ml-1.5 font-bold uppercase tracking-tighter">
                                                      {degreesToCardinal(conditions.windDirection)} ({Math.round(conditions.windDirection)}°)
                                                    </span>
                                                  )}
                                                </p>
                                              </div>

                                              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 group-hover/card:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <Waves className="w-3.5 h-3.5 text-blue-400" />
                                                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Swell</span>
                                                </div>
                                                <p className="text-xs font-black text-white">
                                                  {conditions.swellHeight != null ? `${Number(conditions.swellHeight).toFixed(1)}m` : "--"}
                                                  {conditions.swellPeriod != null && (
                                                    <span className="text-[10px] text-white/40 ml-1.5 font-bold uppercase tracking-tighter">
                                                      {conditions.swellPeriod}s
                                                    </span>
                                                  )}
                                                  {conditions.swellDirection != null && (
                                                    <span className="text-[10px] text-white/40 ml-1.5 font-bold uppercase tracking-tighter">
                                                      {degreesToCardinal(conditions.swellDirection)} ({Math.round(conditions.swellDirection)}°)
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
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
              <div className="px-5 md:px-10 pb-5">
                <div className="bg-white/5 rounded-2xl p-5 md:p-5 flex items-center gap-5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--color-tertiary)]/10 flex items-center justify-center border border-[var(--color-tertiary)]/20 shadow-lg">
                    <Calendar className="w-6 h-6 md:w-7 md:h-7 text-[var(--color-tertiary)]" />
                  </div>
                  <div>
                    <h2 className="text-xs text-white font-black uppercase tracking-[0.2em] mb-1">
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
                <div className="px-5 md:px-10 pb-10">
                  <div className="space-y-5 pt-5">
                    <h2 className="text-xs text-white font-black uppercase tracking-[0.2em]">
                      Logger comments
                    </h2>
                    <div className={cn("bg-white/5 rounded-2xl p-5 md:p-10 border-l-4 border-[var(--color-tertiary)] border border-white/5 shadow-2xl relative overflow-hidden", isGatedGem && "blur-[10px] select-none opacity-40")}>
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <svg className="w-12 h-12 text-[var(--color-tertiary)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM5.017 21V18C5.017 16.8954 5.91243 16 7.017 16H10.017C11.1216 16 12.017 16.8954 12.017 18V21C12.017 22.1046 11.1216 23 10.017 23H7.017C5.91243 23 5.017 22.1046 5.017 21ZM19.017 13C17.9124 13 17.017 12.1046 17.017 11V5C17.017 3.89543 17.9124 3 19.017 3H21.017C22.1216 3 23.017 3.89543 23.017 5V11C23.017 12.1046 22.1216 13 21.017 13H19.017ZM10.017 13C8.91243 13 8.017 12.1046 8.017 11V5C8.017 3.89543 8.91243 3 10.017 3H12.017C13.1216 3 14.017 3.89543 14.017 5V11C14.017 12.1046 13.1216 13 12.017 13H10.017Z" />
                        </svg>
                      </div>
                      <p className="text-white/80 font-primary text-base md:text-lg leading-relaxed whitespace-pre-wrap relative z-10 italic">
                        {isGatedGem ? "Community intelligence redacted. Subscribe to unlock session comments." : (typeof entry.comments === 'string' ? `"${entry.comments}"` : "")}
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
