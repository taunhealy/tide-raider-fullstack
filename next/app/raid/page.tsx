import { Suspense } from "react";
import BeachContainer from "@/app/components/BeachContainer";
import RaidSkeleton from "@/app/components/skeletons/RaidSkeleton";
import { beachData } from "@/app/types/beaches";
import { BeachProvider } from "@/app/context/BeachContext";

async function getInitialFilters(searchParams: { [key: string]: string }) {
  const regionId = searchParams.regionId || "";
  const region =
    beachData.find((b) => b.region?.id === regionId)?.region?.name || "";

  return {
    location: {
      region,
      regionId,
      country: "",
      continent: "",
    },
    waveType: [],
    difficulty: [],
    minPoints: 0,
    crimeLevel: [],
    sharkAttack: [],
    searchQuery: "",
    hasAttack: false,
  };
}

async function RaidContent() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <BeachProvider initialBeaches={beachData}>
              <BeachContainer />
            </BeachProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function RaidPage({
  searchParams,
}: {
  searchParams: { [key: string]: string };
}) {
  const initialFilters = await getInitialFilters(searchParams);

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1">
            <Suspense fallback={<RaidSkeleton />}>
              <BeachProvider
                initialBeaches={beachData}
                initialFilters={initialFilters}
              >
                <BeachContainer />
              </BeachProvider>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
