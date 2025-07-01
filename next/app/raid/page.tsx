import BeachContainer from "@/app/components/BeachContainer";
import { BeachService } from "@/app/services/beaches/BeachService";
import { Suspense } from "react";
import BeachCardSkeleton from "../components/skeletons/BeachCardSkeleton";

export default async function RaidPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = Object.fromEntries(
    Object.entries(await searchParams)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  ) as Record<string, string>;

  const initialData = (await searchParams.regionId)
    ? await BeachService.getFilteredBeaches(new URLSearchParams(params))
    : null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="container mx-auto px-4 py-8">
        <BeachContainer initialData={initialData} />
      </div>
    </div>
  );
}
