import React from "react";

interface EmptyStateProps {
  message?: string;
  helpText?: string;
}

export default function EmptyState({
  message = "No beaches found",
  helpText,
}: EmptyStateProps) {
  // Determine help text based on message if not provided
  const defaultHelpText =
    helpText ??
    (message === "Select a region to view beaches"
      ? "Choose a region from the recent searches or use the filters"
      : message === "No beaches found in this region"
        ? "Try selecting a different region"
        : "Try adjusting your filters or selecting a different region");

  return (
    <div className="text-center p-8 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium">{message}</h3>
      <p className="text-gray-500 mt-2">{defaultHelpText}</p>
    </div>
  );
}
