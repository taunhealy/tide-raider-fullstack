export function LogEntrySkeleton() {
  return (
    <div className="border border-[var(--color-border-light)] rounded-lg p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
        <div className="h-5 w-24 bg-gray-200 rounded"></div>
      </div>

      <div className="bg-[var(--color-bg-primary)] rounded-lg p-4 border border-[var(--color-border-light)] space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-4 w-24 bg-gray-200 rounded ml-2"></div>
        </div>

        <div className="border-t border-[var(--color-border-light)] pt-4">
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
