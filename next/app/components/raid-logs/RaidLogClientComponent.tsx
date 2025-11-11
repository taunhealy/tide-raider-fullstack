"use client";

import { useState, useEffect } from "react";
import RaidLogDetails from "./RaidLogDetails";
import type { LogEntry } from "@/app/types/raidlogs";
import { SessionProvider } from "next-auth/react";

interface RaidLogClientComponentProps {
  entry: LogEntry & {
    existingAlert?: { message: string } | null;
  };
  fallback: React.ReactNode;
}

export default function RaidLogClientComponent({
  entry,
  fallback,
}: RaidLogClientComponentProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return (
    <SessionProvider>
      <RaidLogDetails id={entry.id} />
    </SessionProvider>
  );
}
