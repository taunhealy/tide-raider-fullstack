"use client";

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

export function ErrorBoundaryClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      }
    >
      {children}
    </ReactErrorBoundary>
  );
}
