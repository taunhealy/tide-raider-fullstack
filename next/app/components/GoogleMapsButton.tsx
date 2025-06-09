import { MapPin } from "lucide-react";

interface GoogleMapsButtonProps {
  coordinates: {
    lat: number;
    lng: number;
  };
  name: string;
  region: string | undefined;
  location: string;
  className?: string;
}

export default function GoogleMapsButton({
  name,
  region,
  location,
  className,
}: GoogleMapsButtonProps) {
  const searchQuery = encodeURIComponent(`${name}, ${location}, ${region}`);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;

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
