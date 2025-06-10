"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Star, Pencil } from "lucide-react";
import { cn } from "@/app/lib/utils";
import CommentThread from "@/app/components/comments/CommentThread";
import ProfileHeader from "@/app/components/profile/ProfileHeader";
import { Button } from "@/app/components/ui/Button";
import type { LogEntry } from "@/app/types/raidlogs";

interface RaidLogDetailsProps {
  entry: LogEntry & {
    existingAlert?: { message: string } | null;
  };
}

export default function RaidLogDetails({ entry }: RaidLogDetailsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isOwner = session?.user?.id === entry.userId;

  // Handle forecast data properly - it might be an array or a single object
  const forecastData =
    entry.forecast && Array.isArray(entry.forecast)
      ? entry.forecast[0]
      : entry.forecast;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/raidlogs"
          className="text-brand-2 hover:underline inline-flex items-center gap-1 font-primary"
        >
          <span className="text-lg">←</span> Back to logs
        </Link>

        {isOwner && (
          <Button
            onClick={() => router.push(`/raidlogs/${entry.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Log
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Details Section - Now on the left */}
          <div className="p-6 space-y-6">
            {/* Logger Section - Using ProfileHeader */}
            {!entry.isAnonymous && entry.userId && (
              <ProfileHeader
                userId={entry.userId}
                isOwnProfile={false}
                nationalitySelector={null}
              />
            )}

            {entry.isAnonymous && (
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-[var(--color-tertiary)] rounded-full w-10 h-10 flex items-center justify-center text-white font-medium text-lg">
                  A
                </div>
                <p className="text-gray-800 font-primary font-medium">
                  Anonymous
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-primary font-semibold">
                  {entry.beachName || "Unnamed Beach"}
                </h1>
                {Number(entry.surferRating) > 3 && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-primary">
                    Top Rated
                  </span>
                )}
              </div>
              <p className="text-gray-600 font-primary">
                {entry.region
                  ? `${entry.region}${entry.country ? `, ${entry.country}` : ""}`
                  : "No location specified"}
              </p>
            </div>

            {/* Rating Section */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Star
                    key={rating}
                    className={cn(
                      "w-5 h-5",
                      rating <= (entry.surferRating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 font-primary">
                {entry.surferRating}/5
              </span>
            </div>

            {/* Date and Conditions */}
            <div className="space-y-4">
              <div>
                <h2 className="font-primary text-[18px] font-medium mb-2 text-gray-800">
                  Session Date
                </h2>
                <p className="text-gray-700 font-primary">
                  {format(new Date(entry.date), "MMMM d, yyyy")}
                </p>
              </div>

              {forecastData && (
                <div>
                  <h2 className="font-primary text-[18px] font-medium mb-2 text-gray-800">
                    Conditions
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-gray-700 font-primary">
                      Wind: {forecastData.windSpeed}kts{" "}
                      {forecastData.windDirection}°
                    </p>
                    <p className="text-gray-700 font-primary">
                      Swell: {forecastData.swellHeight}m{" "}
                      {forecastData.swellDirection}°
                    </p>
                    <p className="text-gray-700 font-primary">
                      Period: {forecastData.swellPeriod}s
                    </p>
                  </div>
                </div>
              )}
            </div>

            {entry.comments && (
              <div>
                <h2 className="font-primary text-[18px] font-medium mb-4 text-gray-800">
                  Logger Comments
                </h2>
                <p className="text-gray-700 font-primary whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                  {entry.comments}
                </p>
              </div>
            )}

            {entry.existingAlert && entry.existingAlert.message && (
              <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                <h2 className="font-primary text-lg font-medium mb-2 text-amber-800">
                  Alert
                </h2>
                <p className="text-amber-700 font-primary">
                  {entry.existingAlert.message}
                </p>
              </div>
            )}
          </div>

          {/* Image Section - Now on the right */}
          <div className="p-8">
            <div className="relative aspect-video w-full rounded-lg">
              {entry.imageUrl ? (
                <Image
                  src={entry.imageUrl}
                  alt="Session photo"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                  <span className="text-gray-400 font-primary">
                    No image available
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Comments Section - Moved outside the grid */}
        <div className="border-t border-gray-200 p-6">
          <h2 className="font-primary text-[18px] font-medium mb-4 text-gray-800">
            Comments
          </h2>
          <CommentThread logEntryId={entry.id} />
        </div>
      </div>
    </div>
  );
}
