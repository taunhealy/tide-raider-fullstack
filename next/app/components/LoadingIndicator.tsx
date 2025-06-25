export default function LoadingIndicator() {
  return (
    <div className="absolute inset-0 bg-white/50 z-10 flex items-start justify-end p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-bg-tertiary)]" />
    </div>
  );
}
