"use client";

import { RaidLogsComponent } from "@/app/components/raid-logs/RaidLogsComponent";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useRouter } from "next/navigation";

export default function RaidLogsPage() {
  const { status: authStatus } = useBackendAuth();
  const router = useRouter();

  if (authStatus === "loading") {
    return <RandomLoader isLoading={true} />;
  }

  // Allow access even without session
  return (
    <div className="p-2 sm:p-4 md:p-4 mx-2">
      <RaidLogsComponent />
    </div>
  );
}
