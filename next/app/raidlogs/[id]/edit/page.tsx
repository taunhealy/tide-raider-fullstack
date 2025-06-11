"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Beach } from "@/app/types/beaches";
import { useBeaches } from "@/app/hooks/useBeaches";

export default function RaidLogPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { data: beaches = [], isLoading: isLoadingBeaches } = useBeaches();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["raidLog", params.id],
    queryFn: async () => {
      const [logRes, alertRes] = await Promise.all([
        fetch(`/api/raid-logs/${params.id}`),
        fetch(`/api/alerts?logEntryId=${params.id}`),
      ]);

      const logData = await logRes.json();
      const alertData = await alertRes.json();

      return {
        ...logData,
        existingAlert: alertData,
      };
    },
  });

  if (isLoading || isLoadingBeaches) return <RandomLoader isLoading={true} />;

  const isAuthor = entry?.surferEmail === session?.user?.email;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {isAuthor ? (
        <RaidLogForm
          isOpen={true}
          onClose={() => router.push("/raidlogs")}
          entry={entry}
          isEditing={true}
          beaches={beaches}
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
