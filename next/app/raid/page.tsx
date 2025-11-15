import { BeachService } from "@/app/services/beaches/BeachService";
import BeachContainer from "@/app/components/BeachContainer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raid | Tide Raider",
  description: "Find the best surf spots in your area",
};

type RaidPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function RaidPage({ searchParams }: RaidPageProps) {
  try {
    const awaitedSearchParams = await searchParams || {};
    // Convert searchParams to URLSearchParams safely
    const urlSearchParams = new URLSearchParams();
    // Ensure searchParams is treated as a plain object for iteration
    const plainSearchParams = Object.fromEntries(
      Object.entries(awaitedSearchParams).filter(
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

    let initialData = null;
    if (regionIdFromParams) {
      try {
        initialData = await BeachService.getFilteredBeaches(urlSearchParams);
      } catch (error) {
        console.error("Error fetching filtered beaches:", error);
        // Continue with null - component will handle empty state
      }
    }

    return <BeachContainer initialData={initialData} />;
  } catch (error) {
    console.error("Error in RaidPage:", error);
    // Return component with null data - it will handle the error state
    return <BeachContainer initialData={null} />;
  }
}
