import RaidLogDetails from "@/app/components/raid-logs/RaidLogDetails";
import { Metadata } from "next";
import { cookies } from "next/headers";

import { getBackendUrl } from "@/app/lib/api-config";

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
    const cookieStore = await cookies();
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
    if (!data) return null;
    
    // Backend returns entry directly when fetching by ID
    return data.id ? data : data.entries?.[0] || null;
  } catch (error) {
    console.error("Error fetching raid log for metadata:", error);
    return null;
  }
}

// Fetch user session for metadata access checks
async function getUserSession(authToken: string | undefined) {
  if (!authToken) return null;
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error fetching user session for metadata:", error);
    return null;
  }
}

// Fetch all beaches for robust hidden gem matching
async function getBeaches() {
  try {
    const BACKEND_URL = getBackendUrl();
    const response = await fetch(`${BACKEND_URL}/api/beaches`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.beaches || data || [];
  } catch (error) {
    console.error("Error fetching beaches for metadata:", error);
    return [];
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

  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;
  const user = await getUserSession(authToken);
  const beaches = await getBeaches();

  if (!entry) {
    return {
      title: "Raid Log | Tide Raider",
      description: "View surf session details and conditions",
    };
  }

  // Access check logic - robust matching against known hidden gems
  const isSubscribed = user?.isSubscribed || user?.hasActiveTrial;
  const isOwner = user?.id === entry.userId;
  
  // Robust check for Hidden Gem status (match by relation or by name)
  const isHiddenGem = !!entry.beach?.isHiddenGem || 
                      beaches.some((b: any) => 
                        b.isHiddenGem && (
                          b.id === entry.beachId || 
                          b.name?.toLowerCase() === entry.beachName?.toLowerCase()
                        )
                      );
                      
  // Always unlocked per user request
  const hasAccess = true;

  // Mask metadata if it's a gated hidden gem
  const beachName = hasAccess 
    ? (entry.beach?.name || entry.beachName || "Surf Session")
    : "Hidden Gem";

  const location = entry.region?.name
    ? `${entry.region.name}${entry.region.country ? `, ${entry.region.country.name}` : ""}`
    : "";

  const description = (hasAccess && entry.comments)
    ? `${entry.comments.substring(0, 150)}${entry.comments.length > 150 ? "..." : ""}`
    : `Surf session at ${beachName}${location ? ` in ${location}` : ""}. Rating: ${entry.surferRating || 0}/5 stars.`;

  // Get image URL - prefer first image from imageUrls array, fallback to imageUrl
  // Only include images in metadata if the user has access to see them
  const imageUrls = hasAccess
    ? ((entry as any).imageUrls || (entry.imageUrl ? [entry.imageUrl] : []))
    : [];
  const imageUrl = imageUrls.length > 0 ? imageUrls[0] : (hasAccess ? entry.imageUrl : undefined);

  // Make image URL absolute if it's relative
  const absoluteImageUrl = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : imageUrl.startsWith("/")
        ? `${baseUrl}${imageUrl}`
        : `${baseUrl}/${imageUrl}`
    : undefined;

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
    <div className="bg-gray-950 min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <RaidLogDetails id={id} />
      </div>
    </div>
  );
}
