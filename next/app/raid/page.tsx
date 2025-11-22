import BeachContainerWrapper from "@/app/components/BeachContainerWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raid | Tide Raider",
  description: "Find the best surf spots in your area",
};

/**
 * Server component that renders the raid page
 * Data fetching is handled client-side to avoid Vercel timeout issues
 */
export default function RaidPage() {
  // Don't fetch data server-side - causes timeouts on Vercel (10s limit)
  // BeachContainer handles all data fetching client-side via useFilteredBeaches
  return <BeachContainerWrapper initialData={null} />;
}
