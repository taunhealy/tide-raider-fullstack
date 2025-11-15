"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Beach } from "@/app/types/beaches";

interface BeachContextType {
  beaches: Beach[];
}

const BeachContext = createContext<BeachContextType | undefined>(undefined);

export function BeachProvider({
  children,
  initialBeaches,
}: {
  children: ReactNode;
  initialBeaches: Beach[] | any[];
}) {
  return (
    <BeachContext.Provider value={{ beaches: initialBeaches as Beach[] }}>
      {children}
    </BeachContext.Provider>
  );
}

export function useBeach() {
  const context = useContext(BeachContext);
  if (context === undefined) {
    throw new Error("useBeach must be used within a BeachProvider");
  }
  return context;
}

export { BeachContext };
