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
} from "lucide-react";
import { degreesToCardinal } from "@/app/lib/forecastUtils";
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
import type { VideoPlatform } from "@/app/types/raidlogs";
import { useRaidLog } from "@/app/hooks/useRaidLog";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import ForecastAlertForm from "@/app/components/alerts/ForecastAlertForm";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { ShurikenLoader } from "@/app/components/ui/ShurikenLoader";

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
  // Use entry data directly - no need to fetch since entry already has user info
  // The entry.user object from backend includes: id, name, nationality
  // Image would need to be added to backend's user relation in log entries
  const userData = entryUserData;
  const displayName = userData?.name || "Anonymous";
  const userImage = entryUserData?.image || null; // Image not included in entry.user yet
  const avatarSize = 56; // 14 * 4 = 56px (w-14 h-14)

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
        className="text-[var(--color-text-primary)] font-primary font-semibold text-sm hover:text-[var(--color-tertiary)] transition-colors"
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

  const isOwner = session?.user?.id === entry?.userId;

  // Fetch beach scores for all sources (A, B, C) for this date
  // Must be called before any conditional returns to follow Rules of Hooks
  const beachId = entry ? (entry as any).beachId || entry.beach?.id : null;
  const logDate = entry?.date
    ? new Date(entry.date).toISOString().split("T")[0]
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

  // Check if user has an existing alert for this log entry
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
        <div className="text-center">
          <ShurikenLoader />
          <p className="text-white/40 font-primary mt-32 tracking-widest text-xs uppercase animate-pulse">Synchronizing session intel...</p>
        </div>
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

  // Forecast is always a single object (one-to-one relation) or null from Prisma
  const forecastData = entry.forecast || null;

  // Check if media is available (including uploaded videos without platform)
  // Validate that videoUrl is not empty string
  // Support both single imageUrl and imageUrls array
  const entryImageUrls = (entry as any).imageUrls;
  const imageUrls =
    entryImageUrls && entryImageUrls.length > 0
      ? entryImageUrls
      : entry.imageUrl
        ? [entry.imageUrl]
        : [];
  const hasMedia =
    imageUrls.length > 0 || (entry.videoUrl && entry.videoUrl.trim() !== "");

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
            <Button
              onClick={() => setIsAlertModalOpen(true)}
              variant="dark"
              size="sm"
              className="flex items-center gap-2 font-primary text-sm"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">
                {existingAlert ? "Edit Alert" : "Set Alert"}
              </span>
            </Button>

            {isOwner && (
              <Button
                onClick={() => router.push(`/raidlogs/${entry.id}/edit`)}
                variant="dark"
                size="sm"
                className="flex items-center gap-2 font-primary text-sm"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Log</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="bg-brand-dark rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.05)] overflow-hidden border border-cyan-500/20 ring-1 ring-white/5">
          {/* Content Grid - Make video player bigger (2/3 width) */}
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 p-6 md:p-10">
            {/* Main Content - 1/3 width if video exists, full width otherwise */}
            <div
              className={`${hasMedia && entry.videoUrl && !entry.videoPlatform ? "lg:col-span-1 lg:order-2" : hasMedia ? "lg:col-span-2 lg:order-1" : "lg:col-span-3"} space-y-4 md:space-y-6`}
            >
              {/* Header with Beach and Rating */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-wrap items-baseline gap-4">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-primary font-bold text-white tracking-tighter">
                    {entry.beach?.name || entry.beachName || "Unnamed Beach"}
                  </h1>
                  {Number(entry.surferRating) > 3 && (
                    <span className="bg-[var(--color-tertiary)]/20 text-[var(--color-tertiary)] text-[10px] px-3 py-1 rounded-full font-primary font-black uppercase tracking-widest border border-[var(--color-tertiary)]/30">
                      Top Rated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-white/50 font-primary text-sm md:text-base">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-[var(--color-tertiary)]" />
                  <p className="truncate">
                    {entry.region?.name
                      ? `${entry.region.name}${entry.region.country ? `, ${entry.region.country.name}` : ""}`
                      : "No location specified"}
                  </p>
                </div>

                {/* Logger Info - positioned below location and above stars - Instagram style */}
                <div className="space-y-3 pt-4">
                  <h2 className="font-primary text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                    Logger
                  </h2>
                  {entry.isAnonymous ? (
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
                  ) : entry.user?.id ? (
                    <LoggerDisplay
                      userId={entry.user.id}
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

                <div className="space-y-3 pt-4">
                  <h2 className="font-primary text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                    Surf Session Rating
                  </h2>
                  <div className="flex items-center gap-3">
                    <BlueStarRating
                      score={entry.surferRating || 0}
                      outOfFive={true}
                    />
                  </div>
                </div>

                {/* Conditions Section - Improved to show all sources */}
                <div className="space-y-6 pt-10">
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 className="font-primary text-xl lg:text-2xl font-bold text-white tracking-tighter">
                      Conditions Data
                    </h2>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    {/* Hero Image - First image from album */}
                    {imageUrls.length > 0 && (
                      <div className="w-full">
                        <div
                          className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-[var(--color-tertiary)]/50 transition-all bg-gray-900 group shadow-2xl"
                          onClick={() => {
                            setSelectedImageIndex(0);
                            setIsMediaModalOpen(true);
                          }}
                        >
                          <Image
                            src={imageUrls[0]}
                            alt="Session hero image"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="100vw"
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                        </div>
                      </div>
                    )}

                    {/* Conditions Grids - Display all 3 sources if available */}
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
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {beachScores?.scores?.map((score: any) => {
                          const conditions = score.conditions || (score.source === 'WINDFINDER' ? forecastData : null);
                          
                          return (
                            <div key={score.source} className="bg-white/5 border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/10 hover:border-white/10">
                              <div className="flex items-center justify-between mb-6">
                                <h3 className="font-primary text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                  {score.sourceName}
                                </h3>
                                <div className="flex items-center gap-1.5 translate-y-[-2px]">
                                  <BlueStarRating score={score.starRating} outOfFive={true} size={12} />
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                {conditions ? (
                                  <>
                                    {/* Wind */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                      <div className="w-8 h-8 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center flex-shrink-0">
                                        <Wind className="w-4 h-4 text-[var(--color-tertiary)]" />
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Wind</p>
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

                                    {/* Swell */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                      <div className="w-8 h-8 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center flex-shrink-0">
                                        <Waves className="w-4 h-4 text-[var(--color-tertiary)]" />
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Swell</p>
                                        <p className="text-xs font-black text-white">
                                          {conditions.swellHeight != null ? `${Number(conditions.swellHeight).toFixed(1)}m` : "N/A"}
                                          {conditions.swellDirection != null && (
                                            <span className="text-white/40 font-bold ml-1 tracking-tighter">
                                              {degreesToCardinal(conditions.swellDirection)}
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Period */}
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                      <div className="w-8 h-8 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-[var(--color-tertiary)]" />
                                      </div>
                                      <div>
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">Period</p>
                                        <p className="text-xs font-black text-white">{conditions.swellPeriod != null ? `${conditions.swellPeriod}s` : "N/A"}</p>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="h-32 flex flex-col items-center justify-center gap-2 border border-dashed border-white/10 rounded-xl">
                                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                      <InfoIcon className="w-3 h-3 text-white/20" />
                                    </div>
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">No Data Avail</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              
              </div>

              {/* Session Date */}
              <div className="bg-white/5 rounded-2xl p-5 md:p-6 flex items-center gap-4 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--color-tertiary)]/10 flex items-center justify-center border border-[var(--color-tertiary)]/20 shadow-lg">
                  <Calendar className="w-6 h-6 md:w-7 md:h-7 text-[var(--color-tertiary)]" />
                </div>
                <div>
                  <h2 className="font-primary text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
                    Session Date
                  </h2>
                  <p className="text-white font-primary font-black text-lg md:text-xl uppercase tracking-tighter">
                    {format(new Date(entry.date).getTime() + (new Date().getTimezoneOffset() * 60000), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Comments Section */}
              {entry.comments && (
                <div className="space-y-4 pt-4">
                  <h2 className="font-primary text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                    Logger Comments
                  </h2>
                  <div className="bg-white/5 rounded-2xl p-6 md:p-8 border-l-4 border-[var(--color-tertiary)] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <svg className="w-12 h-12 text-[var(--color-tertiary)]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM5.017 21V18C5.017 16.8954 5.91243 16 7.017 16H10.017C11.1216 16 12.017 16.8954 12.017 18V21C12.017 22.1046 11.1216 23 10.017 23H7.017C5.91243 23 5.017 22.1046 5.017 21ZM19.017 13C17.9124 13 17.017 12.1046 17.017 11V5C17.017 3.89543 17.9124 3 19.017 3H21.017C22.1216 3 23.017 3.89543 23.017 5V11C23.017 12.1046 22.1216 13 21.017 13H19.017ZM10.017 13C8.91243 13 8.017 12.1046 8.017 11V5C8.017 3.89543 8.91243 3 10.017 3H12.017C13.1216 3 14.017 3.89543 14.017 5V11C14.017 12.1046 13.1216 13 12.017 13H10.017Z" />
                      </svg>
                    </div>
                    <p className="text-white/80 font-primary text-base md:text-lg leading-relaxed whitespace-pre-wrap relative z-10 italic">
                      "{entry.comments}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Left Sidebar - Video Player - 2/3 width on desktop for uploaded videos */}
            {hasMedia && (
              <div
                className={
                  entry.videoUrl && !entry.videoPlatform
                    ? "lg:col-span-2 lg:order-1"
                    : "lg:col-span-1 lg:order-2"
                }
              >
                <div
                  className={
                    entry.videoUrl && !entry.videoPlatform
                      ? "sticky top-20"
                      : "sticky top-20"
                  }
                >
                  {entry.videoUrl && entry.videoUrl.trim() !== "" ? (
                    // Check if it's an uploaded video (no platform) or external (YouTube/Vimeo)
                    !entry.videoPlatform ? (
                      // Uploaded video - use CustomVideoPlayer with full controls, make it bigger (2/3 width)
                      <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 max-h-[80vh] bg-black">
                        <CustomVideoPlayer
                          videoUrl={entry.videoUrl}
                          className="w-full min-h-[400px] lg:min-h-[600px] max-h-[80vh]"
                        />
                      </div>
                    ) : (
                      // External video (YouTube/Vimeo) - show thumbnail and link to source
                      <a
                        href={entry.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-full aspect-video rounded-lg overflow-hidden block cursor-pointer hover:opacity-95 transition-opacity bg-gray-100 group shadow-sm"
                      >
                        <Image
                          src={getVideoThumbnail(
                            entry.videoUrl,
                            entry.videoPlatform
                          )}
                          alt="Video thumbnail"
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          priority
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <VideoIcon className="w-6 h-6 md:w-8 md:h-8 text-[var(--color-tertiary)]" />
                          </div>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-primary backdrop-blur-sm">
                          {entry.videoPlatform === "youtube"
                            ? "YouTube"
                            : "Vimeo"}
                        </div>
                      </a>
                    )
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Image Gallery Section - Below Details */}
          {imageUrls.length > 0 && (
            <div className="border-t border-white/5 p-8 md:p-12 lg:p-16 bg-black/20">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="font-primary text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                  Session Album
                </h2>
                <div className="h-px flex-1 bg-white/5"></div>
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                  {imageUrls.length} Files
                </span>
              </div>
              <ImageGallery
                images={imageUrls}
                onImageClick={(index) => {
                  setSelectedImageIndex(index);
                  setIsMediaModalOpen(true);
                }}
                className="cursor-pointer"
              />
            </div>
          )}

          {/* User Comments Section */}
          <div className="border-t border-white/5 p-8 md:p-12 lg:p-16 bg-black/40">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-primary text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                Tactical Discussion
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
        imageUrl={entry.imageUrl}
        imageUrls={imageUrls}
        videoUrl={entry.videoUrl}
        videoPlatform={entry.videoPlatform as VideoPlatform}
        initialImageIndex={selectedImageIndex}
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
