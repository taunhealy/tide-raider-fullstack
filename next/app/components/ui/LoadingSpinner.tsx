interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  }[size];

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Pulsing background */}
        <div
          className={`${sizeClass} absolute inset-0 rounded-full bg-[var(--color-tertiary)]/20 animate-ping`}
        />
        {/* Spinning border */}
        <div
          className={`${sizeClass} border-4 border-[var(--color-tertiary)]/30 border-t-[var(--color-tertiary)] rounded-full animate-spin relative`}
          style={{
            boxShadow: "0 0 15px var(--color-tertiary)",
            filter: "brightness(1.2)",
          }}
        />
      </div>
    </div>
  );
}
