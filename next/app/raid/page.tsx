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
  const urlSearchParams = new URLSearchParams();

  // Convert searchParams to URLSearchParams
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      urlSearchParams.append(key, value);
    }
  });

  // Get initial data
  const initialData = searchParams.regionId
    ? await BeachService.getFilteredBeaches(urlSearchParams)
    : null;

  return <BeachContainer initialData={initialData} />;
}
