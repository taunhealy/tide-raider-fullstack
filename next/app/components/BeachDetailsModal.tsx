import { Beach } from "@/app/types/beaches";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DEFAULT_PROFILE_IMAGE,
  WAVE_TYPE_ICONS,
  WaveType,
} from "@/app/lib/constants";
import React from "react";
import { useQuery } from "@tanstack/react-query";

interface BeachDetailsModalProps {
  beach: Beach;
  isOpen: boolean;
  onClose: () => void;
  isSubscribed: boolean;
  onSubscribe: () => void;
}

const getTideIcon = (tide: string) => {
  switch (tide.toLowerCase()) {
    case "low":
      return "🌊";
    case "mid":
      return "🌊🌊";
    case "high":
      return "🌊🌊🌊";
    case "all":
      return "🌊↕️";
    default:
      return "🌊";
  }
};

const formatWaveType = (waveType: string | undefined) => {
  if (!waveType) return "Unknown";
  return waveType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
    .join(" ");
};

const ModalSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Grid Skeleton */}
    <div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-200">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-2.5 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-2.5 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-36 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
    {/* Description Skeleton */}
    <div className="space-y-2.5">
      <div className="h-4 w-24 bg-gray-200 rounded"></div>
      <div className="h-3 w-full bg-gray-200 rounded"></div>
      <div className="h-3 w-5/6 bg-gray-200 rounded"></div>
      <div className="h-3 w-4/5 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function BeachDetailsModal({
  beach,
  isOpen,
  onClose,
  isSubscribed,
  onSubscribe,
}: BeachDetailsModalProps) {
  if (!beach) return null;

  // Lazily fetch the full, rich beach details only when modal is open
  const { data: detailedBeachData, isLoading, error, refetch } = useQuery({
    queryKey: ["beachDetails", beach.id],
    queryFn: async () => {
      const res = await fetch(`/api/beaches/${beach.id || encodeURIComponent(beach.name)}`);
      if (!res.ok) throw new Error("Failed to fetch beach details");
      const json = await res.json();
      return (json.beach || json) as Beach;
    },
    enabled: isOpen && !!beach,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  React.useEffect(() => {
    console.log("BeachDetailsModal isOpen changed to:", isOpen);
    return () => console.log("BeachDetailsModal isOpen cleanup");
  }, [isOpen]);

  const router = useRouter();

  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    window.location.href = "/pricing";
  };

  const activeBeach = detailedBeachData || beach;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative w-[54px] h-[54px] rounded-full overflow-hidden bg-gray-100 border border-gray-200">
              <Image
                src={
                  WAVE_TYPE_ICONS[activeBeach.waveType as WaveType] ??
                  DEFAULT_PROFILE_IMAGE
                }
                alt={`${activeBeach.waveType || "Default"} icon`}
                fill
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
              />
            </div>
            <DialogTitle className="text-lg font-semibold font-primary">
              {activeBeach.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="relative aspect-video w-full mb-4">
          <Image
            src={
              WAVE_TYPE_ICONS[activeBeach.waveType as WaveType] ||
              "/images/hero-cover.jpg"
            }
            alt={activeBeach.name}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
          />
        </div>

        {isLoading ? (
          <ModalSkeleton />
        ) : error ? (
          <div className="py-12 text-center space-y-4">
            <div className="text-sm font-semibold text-red-500">Failed to load detailed break intelligence.</div>
            <button 
              onClick={() => refetch()} 
              className="text-xs px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 font-black uppercase tracking-wider transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-200">
              {/* Details Section */}
              <div className="space-y-3">
                <DetailItem
                  label="Region"
                  value={activeBeach.region?.name || "Unknown"}
                />
                <DetailItem label="Location" value={activeBeach.location} />
                <DetailItem
                  label="Distance"
                  value={`${activeBeach.distanceFromCT}km from CT`}
                />
                <DetailItem
                  label="Wave Type"
                  value={formatWaveType(activeBeach.waveType)}
                />
                <DetailItem label="Difficulty" value={activeBeach.difficulty} />
                <DetailItem
                  label="Wave Size"
                  value={`${activeBeach.swellSize?.min || 0}-${activeBeach.swellSize?.max || 10}m`}
                />
                <DetailItem
                  label="Optimal Tide"
                  value={
                    <span aria-label={`Optimal Tide: ${activeBeach.optimalTide}`}>
                      {getTideIcon(activeBeach.optimalTide)} {activeBeach.optimalTide}
                    </span>
                  }
                />
              </div>

              <div className="space-y-3">
                <DetailItem
                  label="Optimal Wind"
                  value={(activeBeach.optimalWindDirections || []).join(", ")}
                />
                <DetailItem
                  label="Optimal Swell"
                  value={`${activeBeach.optimalSwellDirections?.min || 0}°-${activeBeach.optimalSwellDirections?.max || 360}°`}
                />
                <DetailItem
                  label="Ideal Swell Period"
                  value={`${activeBeach.idealSwellPeriod?.min || 0}-${activeBeach.idealSwellPeriod?.max || 25}s`}
                />
                <DetailItem
                  label="Water Temp"
                  value={`${activeBeach.waterTemp?.winter || 10}°-${activeBeach.waterTemp?.summer || 20}°C`}
                />
                <DetailItem label="Hazards" value={(activeBeach.hazards || []).join(", ")} />
                <DetailItem
                  label="Crime Risk"
                  value={
                    <span title={`Crime Risk: ${activeBeach.crimeLevel}`}>
                      {activeBeach.crimeLevel === "High"
                        ? "💀"
                        : activeBeach.crimeLevel === "Medium"
                          ? "⚠️"
                          : "👮"}
                    </span>
                  }
                />
                <DetailItem
                  label="Shark Attacks"
                  value={
                    <span
                      title={
                        activeBeach.sharkAttack?.hasAttack
                          ? (activeBeach.sharkAttack.incidents || [])
                              ?.filter(Boolean)
                              .map((i) => `${i?.date || 'N/A'}: ${i?.outcome || 'N/A'} - ${i?.details || 'N/A'}`)
                              .join("\n")
                          : "No shark attacks reported"
                      }
                      className="cursor-help"
                    >
                      {activeBeach.sharkAttack?.hasAttack ? "🦈" : "❌"}
                    </span>
                  }
                />
              </div>
            </div>

            {/* Description Section */}
            <div className="mt-2 pt-4 mb-5">
              <h4 className="font-medium text-base mb-3 font-primary">
                Description
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed font-primary">
                {activeBeach.description}
              </p>
            </div>

            {/* Videos Grid Section */}
            {activeBeach.videos && activeBeach.videos.length > 0 && (
              <div className="mt-2 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-base mb-3 font-primary">Videos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(activeBeach.videos || []).filter(Boolean).map((video, index) => {
                    if (!video?.url) return null;
                    const youtubeId = video.url.includes("watch?v=") ? video.url.split("watch?v=")[1] : video.url.split("/").pop();
                    return (
                      <div
                        key={index}
                        className="relative aspect-video w-full min-h-[180px]"
                      >
                        <Image
                          src={
                            video.platform === "youtube"
                              ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                              : `https://vimeo.com/api/oembed.json?url=${video.url}&width=640`
                          }
                          alt={video.title || "Beach video"}
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            className="bg-black/50 hover:bg-black/70 transition-colors p-3 rounded-full"
                            onClick={() => window.open(video.url, "_blank")}
                            title="video title"
                          >
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                        {video.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60">
                            <p className="text-white text-sm truncate font-primary">
                              {video.title}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest font-primary">
        {label}
      </span>
      <div className="text-gray-900 font-bold font-primary mt-0.5 text-sm">{value}</div>
    </div>
  );
}
