"use client";

import React from "react";

interface RandomLoaderProps {
  isLoading: boolean;
}

export function RandomLoader({ isLoading }: RandomLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--color-tertiary)]"></div>
    </div>
  );
}
