"use client";

import { useAppMode } from "@/app/context/AppModeContext";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export default function AppModeToggle() {
  const { mode, setMode, isBetaMode } = useAppMode();

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="app-mode"
        checked={isBetaMode}
        onCheckedChange={(checked) => setMode(checked ? "beta" : "paid")}
      />
      <Label htmlFor="app-mode" className="font-primary text-sm">
        {isBetaMode
          ? "Beta Mode (No Gates)"
          : "Paid Mode (Subscription Required)"}
      </Label>
    </div>
  );
}
