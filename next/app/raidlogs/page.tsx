"use client";

import { RaidLogsComponent } from "@/app/components/raid-logs/RaidLogsComponent";

export default function RaidLogsPage() {
  // Don't wait for auth - this page allows access without session
  // Auth will load in the background and components can use it when ready

  // Allow access even without session - render immediately
  return (
    <div className="p-2 sm:p-4 md:p-4 mx-2">
      <RaidLogsComponent />
    </div>
  );
}
