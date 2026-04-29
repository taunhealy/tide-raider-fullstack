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

const truncateText = (text: string, limit: number) => {
  const words = text.split(" ");
  if (words.length > limit) {
    return words.slice(0, limit).join(" ") + "...";
  }
  return text;
};

const formatWaveType = (waveType: string | undefined) => {
  if (!waveType) return "Unknown";
  return waveType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
    .join(" ");
};

export default function BeachDetailsModal({
  beach,
  isOpen,
  onClose,
  isSubscribed,
  onSubscribe,
}: BeachDetailsModalProps) {
  if (!beach) return null;

  // Add this useEffect to debug
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
                  WAVE_TYPE_ICONS[beach.waveType as WaveType] ??
                  DEFAULT_PROFILE_IMAGE
                }
                alt={`${beach.waveType || "Default"} icon`}
                fill
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
              />
            </div>
            <DialogTitle className="text-lg font-semibold font-primary">
              {beach.name}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="relative aspect-video w-full mb-4">
          <Image
            src={
              WAVE_TYPE_ICONS[beach.waveType as WaveType] ||
              "/images/hero-cover.jpg"
            }
            alt={beach.name}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
          />
        </div>

        <div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-200">
          {/* Details Section */}
          <div className="space-y-3">
            <DetailItem
              label="Region"
              value={beach.region?.name || "Unknown"}
            />
            <DetailItem label="Location" value={beach.location} />
            <DetailItem
              label="Distance"
              value={`${beach.distanceFromCT}km from CT`}
            />
            <DetailItem
              label="Wave Type"
              value={formatWaveType(beach.waveType)}
            />
            <DetailItem label="Difficulty" value={beach.difficulty} />
            <DetailItem
              label="Wave Size"
              value={`${beach.swellSize?.min || 0}-${beach.swellSize?.max || 10}m`}
            />
            <DetailItem
              label="Optimal Tide"
              value={
                <span aria-label={`Optimal Tide: ${beach.optimalTide}`}>
                  {getTideIcon(beach.optimalTide)} {beach.optimalTide}
                </span>
              }
            />
          </div>

          <div className="space-y-3">
            <DetailItem
              label="Optimal Wind"
              value={(beach.optimalWindDirections || []).join(", ")}
            />
            <DetailItem
              label="Optimal Swell"
              value={`${beach.optimalSwellDirections?.min || 0}°-${beach.optimalSwellDirections?.max || 360}°`}
            />
            <DetailItem
              label="Ideal Swell Period"
              value={`${beach.idealSwellPeriod?.min || 0}-${beach.idealSwellPeriod?.max || 25}s`}
            />
            <DetailItem
              label="Water Temp"
              value={`${beach.waterTemp?.winter || 10}°-${beach.waterTemp?.summer || 20}°C`}
            />
            <DetailItem label="Hazards" value={(beach.hazards || []).join(", ")} />
            <DetailItem
              label="Crime Risk"
              value={
                <span title={`Crime Risk: ${beach.crimeLevel}`}>
                  {beach.crimeLevel === "High"
                    ? "💀"
                    : beach.crimeLevel === "Medium"
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
                    beach.sharkAttack.hasAttack
                      ? beach.sharkAttack.incidents
                          ?.filter(Boolean)
                          .map((i) => `${i.date}: ${i.outcome} - ${i.details}`)
                          .join("\n")
                      : "No shark attacks reported"
                  }
                  className="cursor-help"
                >
                  {beach.sharkAttack.hasAttack ? "🦈" : "❌"}
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
            {beach.description}
          </p>
        </div>

        {/* Videos Grid Section */}
        {beach.videos && beach.videos.length > 0 && (
          <div className="mt-2 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-base mb-3 font-primary">Videos</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {beach.videos.map((video, index) => (
                <div
                  key={index}
                  className="relative aspect-video w-full min-h-[180px]"
                >
                  <Image
                    src={
                      video.platform === "youtube"
                        ? `https://img.youtube.com/vi/${video.url.split("watch?v=")[1]}/hqdefault.jpg`
                        : `https://vimeo.com/api/oembed.json?url=${video.url}&width=640`
                    }
                    alt={video.title}
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
              ))}
            </div>
          </div>
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
