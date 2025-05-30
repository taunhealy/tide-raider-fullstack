"use client";

import React from "react";

interface RandomLoaderProps {
  isLoading: boolean;
}

export function RandomLoader({ isLoading }: RandomLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[var(--color-tertiary)]"></div>
    </div>
  );
}
