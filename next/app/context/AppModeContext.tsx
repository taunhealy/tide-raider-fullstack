"use client";

import { createContext, useContext, useState, useEffect } from "react";

type AppMode = "beta" | "paid";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isBetaMode: boolean;
}

const AppModeContext = createContext<AppModeContextType>({
  mode: "beta",
  setMode: () => {},
  isBetaMode: true,
});

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  // Use environment variable to determine default mode
  const defaultMode: AppMode =
    process.env.NEXT_PUBLIC_APP_MODE === "beta" ? "beta" : "paid";
  const [mode, setMode] = useState<AppMode>(defaultMode);

  useEffect(() => {
    // Load saved preference from localStorage on client side
    const savedMode = localStorage.getItem("appMode") as AppMode | null;
    if (savedMode && (savedMode === "beta" || savedMode === "paid")) {
      setMode(savedMode);
    }
  }, []);

  // Save mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("appMode", mode);
  }, [mode]);

  const isBetaMode = mode === "beta";

  return (
    <AppModeContext.Provider
      value={{
        mode,
        setMode,
        isBetaMode,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
