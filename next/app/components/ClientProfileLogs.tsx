"use client";

import { useQuery } from "@tanstack/react-query";
import type { Beach } from "@/app/types/beaches";
import { RaidLogsComponent } from "@/app/components/raid-logs/RaidLogsComponent";

interface ClientProfileLogsProps {
  userId: string;
}

export function ClientProfileLogs({ userId }: ClientProfileLogsProps) {
  const { data: userData } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId,
  });

  return (
    <div className="w-full">
      <RaidLogsComponent
        userId={userId}
        initialFilters={{ isPrivate: false }}
      />
    </div>
  );
}
