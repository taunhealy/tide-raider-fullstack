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
} from "lucide-react";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import CommentThread from "@/app/components/comments/CommentThread";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/app/components/ui/Button";
import type { Prisma } from "@prisma/client";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { useState } from "react";
import { MediaModal } from "./MediaModal";
import { VideoThumbnail } from "./VideoThumbnail";
import type { VideoPlatform } from "@/app/types/raidlogs";
import { useRaidLog } from "@/app/hooks/useRaidLog";

interface RaidLogDetailsProps {
  id: string;
}

// Instagram-style logger display component
function LoggerDisplay({
  userId,
  userData: entryUserData,
}: {
  userId: string;
  userData?: { id: string; name: string; nationality: string | null; image?: string | null } | null;
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
          <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-gray-200">
            <Image
              src={userImage}
              alt={`${displayName}'s avatar`}
              width={avatarSize}
              height={avatarSize}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="bg-[var(--color-tertiary)] rounded-full w-14 h-14 flex items-center justify-center text-white font-semibold text-lg shadow-sm ring-2 ring-gray-200">
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

  const { data: entry, isLoading, error } = useRaidLog(id);

  const isOwner = session?.user?.id === entry?.userId;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-tertiary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-primary">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-primary mb-4">
            Failed to load raid log
          </p>
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

  // Handle forecast data properly - it might be an array or a single object
  const forecastData =
    entry.forecast && Array.isArray(entry.forecast)
      ? entry.forecast[0]
      : entry.forecast;

  // Check if media is available (including uploaded videos without platform)
  const hasMedia = entry.imageUrl || entry.videoUrl;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Navigation and Actions Bar - Fixed at top */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link
            href="/raidlogs"
            className="text-[var(--color-text-primary)] hover:text-[var(--color-tertiary)] transition-colors inline-flex items-center gap-2 font-primary text-sm md:text-base"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Back to log book</span>
            <span className="sm:hidden">Back</span>
          </Link>

          {isOwner && (
            <Button
              onClick={() => router.push(`/raidlogs/${entry.id}/edit`)}
              variant="outline"
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

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8 p-4 md:p-6">
            {/* Main Content - 2/3 width on desktop (or full width if no media) */}
            <div
              className={`${hasMedia ? "lg:col-span-2 lg:order-1" : "lg:col-span-3"} space-y-4 md:space-y-6`}
            >
              {/* Header with Beach and Rating */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-wrap items-start gap-2 md:gap-3">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-primary font-semibold text-[var(--color-text-primary)]">
                    {entry.beach?.name || entry.beachName || "Unnamed Beach"}
                  </h1>
                  {Number(entry.surferRating) > 3 && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-primary font-medium">
                      Top Rated
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-primary text-sm md:text-base">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <p className="truncate">
                    {entry.region?.name
                      ? `${entry.region.name}${entry.region.country ? `, ${entry.region.country.name}` : ""}`
                      : "No location specified"}
                  </p>
                </div>

                {/* Logger Info - positioned below location and above stars - Instagram style */}
                <div className="space-y-2">
                  <h2 className="font-primary text-[12px] text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">
                    Logger
                  </h2>
                  {entry.isAnonymous ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-[var(--color-tertiary)] rounded-full w-14 h-14 flex items-center justify-center text-white font-medium text-xl shadow-sm flex-shrink-0">
                        A
                      </div>
                      <p className="text-[var(--color-text-primary)] font-primary font-semibold text-sm">
                        Anonymous
                      </p>
                    </div>
                  ) : entry.userId ? (
                    <LoggerDisplay userId={entry.userId} userData={entry.user} />
                  ) : entry.user?.id ? (
                    <LoggerDisplay userId={entry.user.id} userData={entry.user} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="bg-[var(--color-tertiary)] rounded-full w-14 h-14 flex items-center justify-center text-white font-medium text-xl shadow-sm flex-shrink-0">
                        A
                      </div>
                      <p className="text-[var(--color-text-primary)] font-primary font-semibold text-sm">
                        {entry.surferName || "Anonymous"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <BlueStarRating
                    score={entry.surferRating || 0}
                    outOfFive={true}
                  />
                </div>
              </div>

              {/* Session Date */}
              <div className="bg-gray-50 rounded-lg p-3 md:p-4 flex items-center gap-3 border border-gray-200">
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-[var(--color-tertiary)]" />
                </div>
                <div>
                  <h2 className="font-primary text-xs md:text-sm font-medium text-[var(--color-text-secondary)] mb-0.5">
                    Session Date
                  </h2>
                  <p className="text-[var(--color-text-primary)] font-primary font-semibold text-sm md:text-base">
                    {format(new Date(entry.date), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Conditions Section */}
              {forecastData && (
                <div className="space-y-3 md:space-y-4">
                  <h2 className="font-primary text-lg md:text-xl font-semibold text-[var(--color-text-primary)]">
                    Surf Conditions
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 flex gap-3 items-center border border-gray-200">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center">
                        <Wind className="w-5 h-5 text-[var(--color-tertiary)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] font-primary mb-0.5">
                          Wind
                        </p>
                        <p className="text-[var(--color-text-primary)] font-primary font-semibold text-sm md:text-base">
                          {forecastData.windSpeed}kts{" "}
                          <span className="text-[var(--color-text-secondary)] font-normal">
                            {forecastData.windDirection}°
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 flex gap-3 items-center border border-gray-200">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center">
                        <Waves className="w-5 h-5 text-[var(--color-tertiary)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] font-primary mb-0.5">
                          Swell
                        </p>
                        <p className="text-[var(--color-text-primary)] font-primary font-semibold text-sm md:text-base">
                          {forecastData.swellHeight}m{" "}
                          <span className="text-[var(--color-text-secondary)] font-normal">
                            {forecastData.swellDirection}°
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 flex gap-3 items-center border border-gray-200">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-tertiary)]/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-[var(--color-tertiary)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] font-primary mb-0.5">
                          Period
                        </p>
                        <p className="text-[var(--color-text-primary)] font-primary font-semibold text-sm md:text-base">
                          {forecastData.swellPeriod}s
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments Section */}
              {entry.comments && (
                <div className="space-y-3 md:space-y-4">
                  <h2 className="font-primary text-lg md:text-xl font-semibold text-[var(--color-text-primary)]">
                    Logger Comments
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4 md:p-5 border-l-4 border-[var(--color-tertiary)] border border-gray-200">
                    <p className="text-[var(--color-text-primary)] font-primary text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                      {entry.comments}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Video/Image Thumbnail - 1/3 width on desktop */}
            {hasMedia && (
              <div className="lg:col-span-1 lg:order-2">
                <div className="sticky top-20">
                  {entry.imageUrl ? (
                    <div
                      className="relative w-full aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity bg-gray-100 shadow-sm"
                      onClick={() => setIsMediaModalOpen(true)}
                    >
                      <Image
                        src={entry.imageUrl}
                        alt="Session photo"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        priority
                      />
                    </div>
                  ) : entry.videoUrl ? (
                    // Check if it's an uploaded video (no platform) or external (YouTube/Vimeo)
                    !entry.videoPlatform ? (
                      // Uploaded video - use VideoThumbnail component for hover playback
                      <div className="w-full">
                        <VideoThumbnail
                          videoUrl={entry.videoUrl}
                          onPlay={() => setIsMediaModalOpen(true)}
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

          {/* User Comments Section */}
          <div className="border-t border-gray-200 p-4 md:p-6 lg:p-8 bg-gray-50/50">
            <h2 className="font-primary text-lg md:text-xl font-semibold mb-4 md:mb-6 text-[var(--color-text-primary)]">
              Discussion
            </h2>
            <CommentThread logEntryId={entry.id} />
          </div>
        </div>
      </div>

      {/* Media Modal */}
      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        imageUrl={entry.imageUrl}
        videoUrl={entry.videoUrl}
        videoPlatform={entry.videoPlatform as VideoPlatform}
      />
    </div>
  );
}
