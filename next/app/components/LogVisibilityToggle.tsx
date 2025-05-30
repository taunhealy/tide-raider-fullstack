"use client";

import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";

interface LogVisibilityToggleProps {
  isPrivate: boolean;
  onChange: (isPrivate: boolean) => void;
}

export function LogVisibilityToggle({
  isPrivate,
  onChange,
}: LogVisibilityToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor="log-visibility"
        className={`cursor-pointer ${!isPrivate ? "opacity-100" : "opacity-50"}`}
        onClick={() => onChange(false)}
      >
        Public
      </Label>

      <Switch
        checked={isPrivate}
        onCheckedChange={onChange}
        id="log-visibility"
        className="w-16 h-8"
      />

      <Label
        htmlFor="log-visibility"
        className={`cursor-pointer ${isPrivate ? "opacity-100" : "opacity-50"}`}
        onClick={() => onChange(true)}
      >
        Private
      </Label>
    </div>
  );
}
