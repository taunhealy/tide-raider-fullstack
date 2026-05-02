"use client";

import { Button } from "./ui/Button";

interface LogVisibilityToggleProps {
  isPrivate: boolean;
  onChange: () => void;
}

export function LogVisibilityToggle({
  isPrivate,
  onChange,
}: LogVisibilityToggleProps) {
  return (
    <Button
      onClick={onChange}
      variant="outline"
      size="sm"
      className="inline-flex h-10 px-5 border-gray-200 hover:bg-gray-50 transition-all font-bold uppercase tracking-widest text-[11px] rounded-xl shadow-sm active:scale-95"
    >
      {isPrivate ? "Private" : "Public"}
    </Button>
  );
}
