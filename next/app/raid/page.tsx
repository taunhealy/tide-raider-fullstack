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
  // Convert searchParams to URLSearchParams safely
  const urlSearchParams = new URLSearchParams();
  // Ensure searchParams is treated as a plain object for iteration
  const plainSearchParams = Object.fromEntries(
    Object.entries(searchParams).filter(
      ([_, value]) => typeof value === "string" || Array.isArray(value)
    )
  );

  Object.entries(plainSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      urlSearchParams.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          urlSearchParams.append(key, item);
        }
      });
    }
  });

  const regionIdFromParams = urlSearchParams.get("regionId"); // Use get from URLSearchParams

  const initialData = regionIdFromParams
    ? await BeachService.getFilteredBeaches(urlSearchParams)
    : null;

  return <BeachContainer initialData={initialData} />;
}
