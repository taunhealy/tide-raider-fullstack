"use client";

import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useEffect } from "react";

export default function NewRaidLogPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useBackendAuth();

  if (authStatus === "loading") return <RandomLoader isLoading={true} />;

  // Redirect to login if not authenticated (use useEffect to avoid render issues)
  useEffect(() => {
    if (authStatus === "unauthenticated" || (!authStatus && !session?.user)) {
      router.push("/login");
    }
  }, [authStatus, session, router]);

  // Don't render form if not authenticated
  if (!session?.user) {
    return <RandomLoader isLoading={true} />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <RaidLogForm
        isOpen={true}
        onClose={() => router.push("/raidlogs")}
        userEmail={session.user?.email || ""}
      />
    </div>
  );
}
