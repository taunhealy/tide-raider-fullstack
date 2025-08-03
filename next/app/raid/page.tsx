import { BeachService } from "@/app/services/beaches/BeachService";
import BeachContainer from "@/app/components/BeachContainer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raid | Tide Raider",
  description: "Find the best surf spots in your area",
};

type RaidPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function RaidPage({ searchParams = {} }: RaidPageProps) {
  // Convert searchParams to URLSearchParams
  const urlSearchParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      urlSearchParams.append(key, value);
    }
  });

  const initialData = searchParams.regionId
    ? await BeachService.getFilteredBeaches(urlSearchParams)
    : null;

  return <BeachContainer initialData={initialData} />;
}
