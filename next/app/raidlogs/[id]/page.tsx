import { Suspense } from "react";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

// Dynamic import for the client component
const RaidLogDetails = dynamic(
  () => import("@/app/components/raid-logs/RaidLogDetails"),
  {
    loading: () => (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 w-full max-w-4xl bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  }
);

// Server-side data fetching
async function getRaidLogData(id: string) {
  try {
    const [logRes, alertRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/raid-logs/${id}`, {
        cache: "no-store",
        credentials: "include",
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/alerts?logEntryId=${id}`, {
        cache: "no-store",
        credentials: "include",
      }),
    ]);

    if (!logRes.ok) return null;
    const logData = await logRes.json();
    let alertData = alertRes.ok ? await alertRes.json() : [];

    return {
      ...logData,
      existingAlert: alertData.length > 0 ? alertData[0] : null,
    };
  } catch (error) {
    return null;
  }
}

export default async function RaidLogPage({
  params,
}: {
  params: { id: string };
}) {
  const entry = await getRaidLogData(params.id);

  if (!entry) {
    notFound();
  }

  return (
    <div className="bg-[var(--color-bg-secondary)] min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="w-full h-[70vh] flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-48 bg-gray-200 rounded mb-6"></div>
                <div className="h-64 w-full max-w-4xl bg-gray-200 rounded"></div>
              </div>
            </div>
          }
        >
          <RaidLogDetails entry={entry} />
        </Suspense>
      </div>
    </div>
  );
}
