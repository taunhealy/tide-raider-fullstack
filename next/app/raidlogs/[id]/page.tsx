import { Suspense } from "react";
import dynamic from "next/dynamic";

// Create a NoSSR wrapper component
const NoSSR = dynamic(() => import("@/app/components/NoSSR"), { ssr: false });

// Only use dynamic import, remove the direct import
const RaidLogDetails = dynamic(
  () => import("@/app/components/raid-logs/RaidLogDetails"),
  {
    ssr: false,
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

// Create a dynamic import with SSR disabled
const RaidLogClientComponent = dynamic(
  () => import("@/app/components/raid-logs/RaidLogClientComponent"),
  { ssr: false }
);

// Add server-side data fetching
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
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 font-primary">
            Log not found
          </h1>
          <p className="text-[var(--color-text-secondary)] font-primary mb-6">
            The raid log you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="/raidlogs"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[var(--color-tertiary)] text-white rounded-md hover:bg-[var(--color-tertiary-dark)] transition-colors font-primary"
          >
            Return to Log Book
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-secondary)] min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <NoSSR>
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
        </NoSSR>
      </div>
    </div>
  );
}
