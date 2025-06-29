export default function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center w-full py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-[var(--color-bg-tertiary)]" />
    </div>
  );
}
