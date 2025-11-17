"use client";

import { Suspense } from "react";
import BeachContainer from "./BeachContainer";
import type { BeachInitialData } from "@/app/types/beaches";

interface BeachContainerWrapperProps {
  initialData: BeachInitialData | null;
}

/**
 * Wrapper component to handle Suspense boundary for useSearchParams()
 * This is required in Next.js 13+ when using useSearchParams() in client components
 */
function BeachContainerContent({ initialData }: BeachContainerWrapperProps) {
  return <BeachContainer initialData={initialData} />;
}

export default function BeachContainerWrapper({
  initialData,
}: BeachContainerWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="bg-[var(--color-bg-secondary)] p-8 text-center min-h-[calc(100vh-72px)] flex items-center justify-center">
          <div className="space-y-4">
            <div className="w-8 h-8 border-4 border-[var(--color-tertiary)]/30 border-t-[var(--color-tertiary)] rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 font-primary">Loading beaches...</p>
          </div>
        </div>
      }
    >
      <BeachContainerContent initialData={initialData} />
    </Suspense>
  );
}

