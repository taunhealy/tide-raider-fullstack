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
 */
export default function RaidPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Pass params to wrapper which will pass them to the container
  return <BeachContainerWrapper initialData={null} searchParams={searchParams} />;
}
