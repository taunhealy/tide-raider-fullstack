import BeachContainerWrapper from "@/app/components/BeachContainerWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raid | Tide Raider",
  description: "Find the best surf spots in your area",
};

// Force dynamic rendering to prevent any static optimization that could cause timeouts
export const dynamic = "force-dynamic";
export const revalidate = 0; // Never cache this page

/**
 * Server component that renders the raid page
 * Data fetching is handled client-side to avoid Vercel timeout issues
 * This page does NO server-side data fetching to prevent 504 timeouts
 */
export default function RaidPage() {
  // Don't fetch data server-side - causes timeouts on Vercel (10s limit)
  // BeachContainer handles all data fetching client-side via useFilteredBeaches
  return <BeachContainerWrapper initialData={null} />;
}
