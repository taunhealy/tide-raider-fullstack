import { Suspense } from "react";
import BeachContainer from "@/app/components/BeachContainer";
import RaidSkeleton from "@/app/components/skeletons/RaidSkeleton";
import { beachData } from "@/app/types/beaches";
import { BeachProvider } from "@/app/context/BeachContext";

async function RaidContent() {

    return (
      <div className="min-h-screen bg-[var(--color-bg-secondary)]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex gap-8">
            <div className="flex-1">
              <BeachProvider initialBeaches={beachData}>
                <BeachContainer
                />
              </BeachProvider>
            </div>
          </div>
        </div>
      </div>
    );
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
