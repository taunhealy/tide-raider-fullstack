export function AlertCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg border border-gray-200 shadow-sm h-[200px] p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );
}
