"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Star,
  Pencil,
  Video as VideoIcon,
  ChevronLeft,
  MapPin,
  Calendar,
  Wind,
  Waves,
  Clock,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import CommentThread from "@/app/components/comments/CommentThread";
import ProfileHeader from "@/app/components/profile/ProfileHeader";
import { Button } from "@/app/components/ui/Button";
import type { Prisma } from "@prisma/client";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { useState } from "react";
import { MediaModal } from "./MediaModal";
import type { VideoPlatform } from "@/app/types/raidlogs";
import { useRaidLog } from "@/app/hooks/useRaidLog";

interface RaidLogDetailsProps {
  id: string;
}

export default function RaidLogDetails({ id }: RaidLogDetailsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isOwner = session?.user?.id === id;
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const { data: entry, isLoading, error } = useRaidLog(id);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !entry) {
    return <div>Failed to load raid log</div>;
  }

  // Handle forecast data properly - it might be an array or a single object
  const forecastData =
    entry.forecast && Array.isArray(entry.forecast)
      ? entry.forecast[0]
      : entry.forecast;

  console.log("Debug - RaidLogDetails:", {
    entry,
    hasForecast: !!entry.forecast,
    forecastData,
  });

  // Check if media is available
  const hasMedia = entry.imageUrl || (entry.videoUrl && entry.videoPlatform);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Navigation and Actions Bar */}
      <div className="flex justify-between items-center mb-6 px-4 md:px-0">
        <Link
          href="/raidlogs"
          className="text-[var(--color-primary)] hover:text-[var(--color-tertiary-dark)] transition-colors inline-flex items-center gap-2 font-primary"
        >
          <ChevronLeft className="w-5 h-5" /> Back to log book
        </Link>

        {isOwner && (
          <Button
            onClick={() => router.push(`/raidlogs/${entry.id}/edit`)}
            className="flex items-center gap-2 bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary-dark)] transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Log
          </Button>
        )}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Hero Section with Image/Video */}
        {hasMedia ? (
          <div className="relative w-full h-64 md:h-80 lg:h-96 bg-gray-100">
            {entry.imageUrl ? (
              <Image
                src={entry.imageUrl}
                alt="Session photo"
                fill
                className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
                onClick={() => setIsMediaModalOpen(true)}
              />
            ) : entry.videoUrl && entry.videoPlatform ? (
              <div
                className="relative w-full h-full cursor-pointer"
                onClick={() => setIsMediaModalOpen(true)}
              >
                <Image
                  src={getVideoThumbnail(entry.videoUrl, entry.videoPlatform)}
                  alt="Video thumbnail"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <VideoIcon className="w-8 h-8 text-[var(--color-tertiary)]" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 p-6 md:p-8">
          {/* Main Content - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header with Beach and Rating */}
            <div>
              <div className="flex flex-wrap items-start gap-2 mb-3">
                <h1 className="text-2xl md:text-3xl font-primary font-semibold text-[var(--color-text-primary)]">
                  {entry.beach?.name || entry.beachName || "Unnamed Beach"}
                </h1>
                {Number(entry.surferRating) > 3 && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-primary">
                    Top Rated
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-600 font-primary mb-4">
                <MapPin className="w-4 h-4" />
                <p>
                  {entry.region?.name
                    ? `${entry.region.name}${entry.region.country ? `, ${entry.region.country.name}` : ""}`
                    : "No location specified"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Star
                      key={rating}
                      className={cn(
                        "w-5 h-5",
                        rating <= (entry.surferRating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-primary">
                  {entry.surferRating}/5
                </span>
              </div>
            </div>

            {/* Session Date */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[var(--color-tertiary)]" />
              <div>
                <h2 className="font-primary text-sm font-medium text-gray-500 mb-1">
                  Session Date
                </h2>
                <p className="text-gray-800 font-primary font-medium">
                  {format(new Date(entry.date), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Conditions Section */}
            {forecastData && (
              <div className="space-y-4">
                <h2 className="font-primary text-xl font-medium text-gray-800">
                  Surf Conditions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg flex gap-3 items-center">
                    <Wind className="w-5 h-5 text-[var(--color-tertiary)]" />
                    <div>
                      <p className="text-sm text-gray-500 font-primary">Wind</p>
                      <p className="text-gray-800 font-primary font-medium">
                        {forecastData.windSpeed}kts {forecastData.windDirection}
                        °
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex gap-3 items-center">
                    <Waves className="w-5 h-5 text-[var(--color-tertiary)]" />
                    <div>
                      <p className="text-sm text-gray-500 font-primary">
                        Swell
                      </p>
                      <p className="text-gray-800 font-primary font-medium">
                        {forecastData.swellHeight}m{" "}
                        {forecastData.swellDirection}°
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex gap-3 items-center">
                    <Clock className="w-5 h-5 text-[var(--color-tertiary)]" />
                    <div>
                      <p className="text-sm text-gray-500 font-primary">
                        Period
                      </p>
                      <p className="text-gray-800 font-primary font-medium">
                        {forecastData.swellPeriod}s
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            {entry.comments && (
              <div className="space-y-4">
                <h2 className="font-primary text-xl font-medium text-gray-800">
                  Logger Comments
                </h2>
                <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-[var(--color-tertiary)]">
                  <p className="text-gray-700 font-primary whitespace-pre-wrap">
                    {entry.comments}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1/3 width on desktop */}
          <div className="lg:col-span-1 space-y-6">
            {/* Logger Info */}
            <div className="bg-gray-50 p-5 rounded-lg">
              <h2 className="font-primary text-lg font-medium mb-4 text-gray-800">
                Logger
              </h2>

              {!entry.isAnonymous && entry.userId ? (
                <ProfileHeader
                  userId={entry.userId}
                  isOwnProfile={false}
                  nationalitySelector={null}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="bg-[var(--color-tertiary)] rounded-full w-10 h-10 flex items-center justify-center text-white font-medium text-lg">
                    A
                  </div>
                  <p className="text-gray-800 font-primary font-medium">
                    Anonymous
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Comments Section */}
        <div className="border-t border-gray-200 p-6 md:p-8">
          <h2 className="font-primary text-xl font-medium mb-6 text-gray-800">
            Discussion
          </h2>
          <CommentThread logEntryId={entry.id} />
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
