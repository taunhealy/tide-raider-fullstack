import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { cn } from "@/app/lib/utils";
import CommentThread from "@/app/components/comments/CommentThread";
import ProfileHeader from "@/app/components/profile/ProfileHeader";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";

// Add server-side data fetching
async function getRaidLogData(id: string) {
  try {
    const [logRes, alertRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/raid-logs/${id}`, {
        cache: "no-store",
        credentials: "include",
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/alerts?logEntryId=${id}`, {
        cache: "no-store",
        credentials: "include",
      }),
    ]);

    if (!logRes.ok) {
      console.error("Failed to fetch log data:", logRes.status);
      return null;
    }

    const logData = await logRes.json();

    let alertData = [];
    if (alertRes.ok) {
      alertData = await alertRes.json();
    } else {
      console.error("Failed to fetch alert data:", alertRes.status);
    }

    return {
      ...logData,
      existingAlert: alertData.length > 0 ? alertData[0] : null,
    };
  } catch (error) {
    return null;
  }
}

// Convert to async component
export default async function RaidLogPage({
  params,
}: {
  params: { id: string };
}) {
  // Add authentication and subscription check
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const hasAccess = session.user.isSubscribed || session.user.hasActiveTrial;
  if (!hasAccess) {
    redirect("/pricing");
  }

  const entry = await getRaidLogData(params.id);

  if (!entry)
    return (
      <div className="flex flex-col align-middle justify-center">
        Log not found
      </div>
    );

  // Add more detailed debug logging
  console.log("Entry data:", JSON.stringify(entry, null, 2));

  // Handle forecast data properly - it might be an array or a single object
  const forecastData =
    entry.forecast && Array.isArray(entry.forecast)
      ? entry.forecast[0]
      : entry.forecast;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/raidlogs"
        className="text-brand-2 hover:underline mb-4 inline-flex items-center gap-1 font-primary"
      >
        <span className="text-lg">←</span> Back to logs
      </Link>

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
                <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center text-gray-700 font-medium text-lg">
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
                  {entry.beachName || entry.beach?.name || "Unnamed Beach"}
                </h1>
                {Number(entry.surferRating) > 3 && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-primary">
                    Top Rated
                  </span>
                )}
              </div>
              <p className="text-gray-600 font-primary">
                {entry.region || entry.beach?.region
                  ? `${entry.region || entry.beach?.region}${
                      entry.country || entry.beach?.country
                        ? `, ${entry.country || entry.beach?.country}`
                        : ""
                    }`
                  : "No location specified"}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <p className="text-gray-700 font-primary">
                {entry.date
                  ? format(new Date(entry.date), "MMMM d, yyyy")
                  : "No date specified"}
              </p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-5 h-5",
                      i < (Number(entry.surferRating) || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Wave Information */}
            {(entry.waveType || forecastData) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="font-primary text-lg font-medium mb-3 text-gray-800">
                  Conditions on{" "}
                  {entry.date
                    ? format(new Date(entry.date), "MMM d, yyyy")
                    : "this day"}
                </h2>
                {entry.waveType && (
                  <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-primary mb-3">
                    {entry.waveType}
                  </div>
                )}
                {forecastData && (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      {forecastData.swellHeight != null && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-primary">
                            Swell Height
                          </span>
                          <span className="text-gray-800 font-primary font-medium">
                            {forecastData.swellHeight}m
                          </span>
                        </div>
                      )}
                      {forecastData.swellPeriod != null && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-primary">
                            Swell Period
                          </span>
                          <span className="text-gray-800 font-primary font-medium">
                            {forecastData.swellPeriod}s
                          </span>
                        </div>
                      )}
                      {forecastData.swellDirection != null && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-primary">
                            Swell Direction
                          </span>
                          <span className="text-gray-800 font-primary font-medium">
                            {forecastData.swellDirection}°
                          </span>
                        </div>
                      )}
                      {forecastData.windSpeed != null && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-primary">
                            Wind Speed
                          </span>
                          <span className="text-gray-800 font-primary font-medium">
                            {forecastData.windSpeed}kts
                          </span>
                        </div>
                      )}
                      {forecastData.windDirection != null && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-primary">
                            Wind Direction
                          </span>
                          <span className="text-gray-800 font-primary font-medium">
                            {forecastData.windDirection}°
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
          <CommentThread logEntryId={params.id} />
        </div>
      </div>
    </div>
  );
}
