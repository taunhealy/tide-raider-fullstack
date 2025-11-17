import BeachContainerWrapper from "@/app/components/BeachContainerWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raid | Tide Raider",
  description: "Find the best surf spots in your area",
};

type RaidPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Server component that fetches initial beach data from backend API
 * This replaces BeachService which was using Prisma directly
 */
export default async function RaidPage({ searchParams }: RaidPageProps) {
  try {
    const awaitedSearchParams = (await searchParams) || {};

    // Convert searchParams to URLSearchParams safely
    const urlSearchParams = new URLSearchParams();
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

    const regionIdFromParams = urlSearchParams.get("regionId");
    let initialData = null;

    // Only fetch if regionId is provided
    if (regionIdFromParams) {
      try {
        // Call backend API directly (server-side fetch works fine)
        // Use NEXT_PUBLIC_API_URL if set, otherwise default to production
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://tide-raider-backend.fly.dev";

        // Build query string with all params including forecastDate
        const queryString = urlSearchParams.toString();
        const backendApiUrl = `${backendUrl}/api/filtered-beaches${queryString ? `?${queryString}` : ""}`;

        const response = await fetch(backendApiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Server-side fetch doesn't need credentials, but we can add auth headers if needed
          cache: "no-store", // Always fetch fresh data for SSR
        });

        if (response.ok) {
          initialData = await response.json();
        } else if (response.status === 429) {
          // Handle rate limiting gracefully - return empty structure
          initialData = {
            beaches: [],
            scores: {},
            forecast: null,
            totalCount: 0,
          };
        }
        // For other errors, initialData remains null and component handles empty state
      } catch (error) {
        console.error(
          "[RaidPage] Error fetching filtered beaches from backend:",
          error
        );
        // Continue with null - component will handle empty state
      }
    }

    return <BeachContainerWrapper initialData={initialData} />;
  } catch (error) {
    console.error("[RaidPage] Error in RaidPage:", error);
    // Return component with null data - it will handle the error state
    return <BeachContainerWrapper initialData={null} />;
  }
}
