import { cache } from "react";
import BeachContainer from "@/app/components/BeachContainer";
import { beachData } from "@/app/types/beaches";
import { client } from "@/app/lib/sanity";
import { prisma } from "@/app/lib/prisma";
import { blogListingQuery } from "@/app/lib/queries";
import { Suspense } from "react";
import RaidSkeleton from "@/app/components/skeletons/RaidSkeleton";

// Cache the blog posts fetch
const getBlogPosts = cache(async () => {
  try {
    const response = await client.fetch(blogListingQuery);
    return response.posts || [];
  } catch (error) {
    console.error("Blog fetch error:", error);
    return [];
  }
});

// Cache the ads fetch
const getActiveAds = cache(async () => {
  try {
    const ads = await prisma.ad.findMany({
      where: {
        status: "active",
        endDate: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        requestId: true,
        createdAt: true,
        updatedAt: true,
        category: true,
        companyName: true,
        imageUrl: true,
        linkUrl: true,
        title: true,
        regionId: true,
        region: {
          select: { name: true, id: true },
        },
        startDate: true,
        endDate: true,
        status: true,
        beachConnections: {
          select: {
            beachId: true,
          },
        },
        userId: true,
      },
    });
    return ads.map((ad) => ({
      ...ad,
      isAd: true as const,
      region: { id: ad.regionId, name: ad.region.name },
    }));
  } catch (error) {
    console.error("Ads fetch error:", error);
    return [];
  }
});

async function RaidContent() {
  try {
    // Use cached functions
    const [blogPosts, activeAds] = await Promise.all([
      getBlogPosts(),
      getActiveAds(),
    ]);

    return (
      <div className="min-h-screen bg-[var(--color-bg-secondary)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            <div className="flex-1">
              <BeachContainer
                initialBeaches={beachData}
                blogPosts={blogPosts}
                availableAds={activeAds}
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in RaidPage:", error);
    return (
      <div className="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p>Please try refreshing the page</p>
        </div>
      </div>
    );
  }
}

export default function RaidPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <Suspense fallback={<RaidSkeleton />}>
              <RaidContent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
