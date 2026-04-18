import { Map } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface GoogleMapsButtonProps {
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  name: string;
  region?: string | undefined;
  location?: string;
  className?: string;
}

export default function GoogleMapsButton({
  coordinates,
  name,
  region,
  location,
  className,
}: GoogleMapsButtonProps) {
  // Use coordinates if available and valid, otherwise fallback to search query
  const hasValidCoordinates =
    coordinates &&
    typeof coordinates.lat === "number" &&
    typeof coordinates.lng === "number" &&
    !isNaN(coordinates.lat) &&
    !isNaN(coordinates.lng);

  const googleMapsUrl = hasValidCoordinates
    ? `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${name}${location ? `, ${location}` : ""}${region ? `, ${region}` : ""}`
      )}`;

  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500",
        className
      )}
      title={`Open ${name} in Google Maps`}
    >
      <Map className="w-4 h-4 md:w-5 md:h-5" />
    </a>
  );
}
