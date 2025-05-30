import { Suspense } from "react";
import WildStoriesContainer from "@/app/components/StoriesContainer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import RandomLoader from "@/app/components/ui/RippleLoader";
import { prisma } from "@/app/lib/prisma";

export default async function StoriesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Fetch beaches from the database instead of using static beachData
  const beaches = await prisma.beach.findMany({
    include: {
      region: true,
    },
  });

  // Transform beaches to match the expected format in the StoriesContainer
  const formattedBeaches = beaches.map((beach) => ({
    id: beach.id,
    name: beach.name,
    region: beach.region?.name || "",
    country: beach.region?.country || beach.country || "",
    continent: beach.region?.continent || beach.continent || "",
    isCustom: false,
  }));

  return (
    <main className="px-[21px] min-h-screen bg-[var(--color-bg-secondary)] pb-12 md:px-[360px] relative">
      <Suspense fallback={<RandomLoader isLoading={true} />}>
        <WildStoriesContainer
          beaches={formattedBeaches}
          userId={userId ?? ""}
        />
      </Suspense>
    </main>
  );
}
