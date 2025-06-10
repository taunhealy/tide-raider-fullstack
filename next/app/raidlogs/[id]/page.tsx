import RaidLogDetails from "@/app/components/raid-logs/RaidLogDetails";

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

    if (!logRes.ok) {
      console.error("Failed to fetch log data:", logRes.status);
      return null;
    }

    const logData = await logRes.json();

    let alertData = [];
    if (alertRes.ok) {
      alertData = await alertRes.json();
    } else {
      console.error("Failed to fetch alert data:", alertRes.status);
    }

    return {
      ...logData,
      existingAlert: alertData.length > 0 ? alertData[0] : null,
    };
  } catch (error) {
    return null;
  }
}

// Convert to async component
export default async function RaidLogPage({
  params,
}: {
  params: { id: string };
}) {
  const entry = await getRaidLogData(params.id);

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Log not found
        </h1>
        <p className="text-gray-600">
          The raid log you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return <RaidLogDetails entry={entry} />;
}
