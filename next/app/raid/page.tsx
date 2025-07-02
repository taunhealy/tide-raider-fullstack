import { BeachService } from "@/app/services/beaches/BeachService";
import BeachContainer from "@/app/components/BeachContainer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raid | Tide Raider",
  description: "Find the best surf spots in your area",
};

export default async function RaidPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Create a URLSearchParams object
  const urlSearchParams = new URLSearchParams();

  // Use Object.entries to safely access searchParams
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      urlSearchParams.set(key, value);
    }
  });

  // Only fetch data if we have a regionId parameter
  const initialData = searchParams.regionId
    ? await BeachService.getFilteredBeaches(urlSearchParams)
    : null;

  return <BeachContainer initialData={initialData} />;
}
