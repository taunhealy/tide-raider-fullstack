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
      className="inline-flex hover:bg-gray-50 transition-colors"
    >
      {isPrivate ? "Private" : "Public"}
    </Button>
  );
}
