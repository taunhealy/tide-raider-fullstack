import RaidLogDetails from "@/app/components/raid-logs/RaidLogDetails";
import { Metadata } from "next";
import { cookies } from "next/headers";

// Get backend URL helper
const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const isDevelopment = process.env.NODE_ENV === "development";
  return (
    envUrl ||
    (isDevelopment
      ? "http://localhost:4001"
      : "https://tide-raider-backend-82632174665.africa-south1.run.app")
  );
};

// Get base URL for absolute image URLs
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://www.tideraider.com";
};

// Fetch raid log data for metadata
async function getRaidLogForMetadata(id: string) {
  try {
    const BACKEND_URL = getBackendUrl();
    const cookieStore = cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/api/raid-logs?id=${id}`, {
      headers,
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Backend returns entry directly when fetching by ID
    return data.id ? data : data.entries?.[0] || null;
  } catch (error) {
    console.error("Error fetching raid log for metadata:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const entry = await getRaidLogForMetadata(id);
  const baseUrl = getBaseUrl();

  if (!entry) {
    return {
      title: "Raid Log | Tide Raider",
      description: "View surf session details and conditions",
    };
  }

  // Get image URL - prefer first image from imageUrls array, fallback to imageUrl
  const imageUrls =
    (entry as any).imageUrls || (entry.imageUrl ? [entry.imageUrl] : []);
  const imageUrl = imageUrls.length > 0 ? imageUrls[0] : entry.imageUrl;

  // Make image URL absolute if it's relative
  // R2 images should already be absolute URLs, but handle both cases
  const absoluteImageUrl = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : imageUrl.startsWith("/")
        ? `${baseUrl}${imageUrl}`
        : `${baseUrl}/${imageUrl}`
    : undefined;

  const beachName = entry.beach?.name || entry.beachName || "Surf Session";
  const location = entry.region?.name
    ? `${entry.region.name}${entry.region.country ? `, ${entry.region.country.name}` : ""}`
    : "";
  const description = entry.comments
    ? `${entry.comments.substring(0, 150)}${entry.comments.length > 150 ? "..." : ""}`
    : `Surf session at ${beachName}${location ? ` in ${location}` : ""}. Rating: ${entry.surferRating || 0}/5 stars.`;

  const metadata: Metadata = {
    title: `${beachName}${location ? ` - ${location}` : ""} | Tide Raider`,
    description,
    openGraph: {
      title: `${beachName}${location ? ` - ${location}` : ""}`,
      description,
      type: "website",
      url: `${baseUrl}/raidlogs/${id}`,
      ...(absoluteImageUrl && {
        images: [
          {
            url: absoluteImageUrl,
            width: 1200,
            height: 630,
            alt: `Surf session at ${beachName}`,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${beachName}${location ? ` - ${location}` : ""}`,
      description,
      ...(absoluteImageUrl && {
        images: [absoluteImageUrl],
      }),
    },
  };

  return metadata;
}

export default async function RaidLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="bg-[var(--color-bg-secondary)] min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <RaidLogDetails id={id} />
      </div>
    </div>
  );
}
