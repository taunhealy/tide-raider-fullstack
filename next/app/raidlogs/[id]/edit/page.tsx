"use client";

import { useSession } from "next-auth/react";
import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";

import { useRouter } from "next/navigation";

import { useBeaches } from "@/app/hooks/useBeaches";
import { useRaidLog } from "@/app/hooks/useRaidLog";

export default function EditRaidLogPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: beaches, isLoading: isLoadingBeaches } = useBeaches();
  const { data: entry, isLoading: isLoadingEntry } = useRaidLog(params.id);

  if (isLoadingBeaches || isLoadingEntry) {
    return <div>Loading...</div>;
  }

  console.log("Entry data:", {
    entry,
    beach: entry?.beach,
    beaches: beaches?.slice(0, 3),
  });

  const isAuthor = entry?.surferEmail === session?.user?.email;

  const selectedBeach = beaches?.find((beach) => beach.id === entry?.beachId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {isAuthor ? (
        <RaidLogForm
          isOpen={true}
          onClose={() => router.push("/raidlogs")}
          entry={{
            ...entry,
            beach: selectedBeach,
          }}
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
