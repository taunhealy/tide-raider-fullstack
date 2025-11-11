"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";

import { useRouter } from "next/navigation";

import { useBeaches } from "@/app/hooks/useBeaches";
import { useRaidLog } from "@/app/hooks/useRaidLog";
import { RandomLoader } from "@/app/components/ui/random-loader";

export default function EditRaidLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const { data: beaches, isLoading: isLoadingBeaches } = useBeaches();
  const { data: entry, isLoading: isLoadingEntry } = useRaidLog(id);

  if (isLoadingBeaches || isLoadingEntry) {
    return <RandomLoader isLoading={true} />;
  }

  console.log("Entry data:", {
    entry,
    beach: entry?.beach,
    beaches: beaches?.slice(0, 3),
  });

  const isAuthor = entry?.surferEmail === session?.user?.email;

  const selectedBeach = beaches?.find((beach) => beach.id === entry?.beachId);

  // Transform the beach object to match expected format
  const transformedBeach = selectedBeach
    ? {
        ...selectedBeach,
        region: selectedBeach.region
          ? {
              ...selectedBeach.region,
              country: selectedBeach.region.country?.name,
            }
          : undefined,
      }
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {isAuthor && entry ? (
        <RaidLogForm
          isOpen={true}
          onClose={() => router.push("/raidlogs")}
          entry={entry}
          isEditing={true}
          beaches={beaches || []}
          userEmail={session?.user?.email || ""}
        />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p>You can only edit your own surf logs</p>
        </div>
      )}
    </div>
  );
}
