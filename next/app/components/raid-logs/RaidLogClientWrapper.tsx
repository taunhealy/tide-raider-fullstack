"use client";

import RaidLogDetails from "./RaidLogDetails";
import type { LogEntry } from "@/app/types/raidlogs";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";

interface RaidLogClientWrapperProps {
  entry: LogEntry & {
    existingAlert?: { message: string } | null;
  };
}

// This is a special component that only renders on the client side
function ClientOnly({ children }: { children: React.ReactNode }) {
  // usePathname() is used here to force this component to be client-only
  // This ensures the children are only rendered on the client side
  usePathname();
  return <>{children}</>;
}

export default function RaidLogClientWrapper({
  entry,
}: RaidLogClientWrapperProps) {
  return (
    <SessionProvider>
      <ClientOnly>
        <RaidLogDetails entry={entry} />
      </ClientOnly>
    </SessionProvider>
  );
}
