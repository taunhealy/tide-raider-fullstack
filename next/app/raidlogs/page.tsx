"use client";

import { RaidLogsComponent } from "@/app/components/raid-logs/RaidLogsComponent";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";

export default function RaidLogsPage() {
  // Fetch auth at page level and pass down to components
  // This page is public (no auth required) but session is needed for ownership checks
  const { data: session } = useBackendAuth();

  // Normalize session type to match component expectation
  // Allow access even without session - render immediately
  // Auth is optional for this page (public logs visible to all)
  const normalizedSession = session ? { user: session.user || null } : null;

  return (
    <div className="p-2 sm:p-4 md:p-4 mx-2">
      <RaidLogsComponent session={normalizedSession} />
    </div>
  );
}
