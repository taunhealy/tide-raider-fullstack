"use client";

import { useState } from "react";
import { LogEntry } from "@/app/types/raidlogs";

interface LogEntrySelectorProps {
  onSelect: (entry: LogEntry | null) => void;
  selected: LogEntry | null;
}

export function LogEntrySelector({
  onSelect,
  selected,
}: LogEntrySelectorProps) {
  // Implementation of log entry selection UI
  return (
    <div>
      <h3 className="text-lg font-medium mb-2 font-primary">
        Select a surf session
      </h3>
      {/* Your selection UI here */}
    </div>
  );
}
