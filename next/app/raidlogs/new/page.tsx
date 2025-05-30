"use client";

import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useState, useEffect } from "react";
import type { Beach } from "@/app/types/beaches";
import { beachData } from "@/app/types/beaches";

export default function NewRaidLogPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [beaches, setBeaches] = useState<Beach[]>([]);

  useEffect(() => {
    // Filter out duplicate beach IDs
    const uniqueBeaches = beachData.reduce<Beach[]>((acc, beach) => {
      // Check if we already have a beach with this ID
      if (!acc.some((b) => b.id === beach.id)) {
        acc.push(beach);
      }
      return acc;
    }, []);

    setBeaches(uniqueBeaches);
  }, []);

  if (status === "loading") return <RandomLoader isLoading={true} />;
  if (!session) return router.push("/login");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <RaidLogForm
        isOpen={true}
        onClose={() => router.push("/raidlogs")}
        userEmail={session.user?.email || ""}
        beaches={beaches}
      />
    </div>
  );
}
