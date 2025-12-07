import { MapPin } from "lucide-react";

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
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-tertiary)] ${className}`}
      title={`Open ${name} in Google Maps`}
    >
      <MapPin className="w-4 h-4" />
      <span>Map</span>
    </a>
  );
}
