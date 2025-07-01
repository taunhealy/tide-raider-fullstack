interface BeachCardSkeletonProps {
  count: number;
}

export default function BeachCardSkeleton({ count }: BeachCardSkeletonProps) {
  return (
    <div className="animate-pulse bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-4 h-4 bg-gray-200 rounded-full" />
          ))}
        </div>
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}
