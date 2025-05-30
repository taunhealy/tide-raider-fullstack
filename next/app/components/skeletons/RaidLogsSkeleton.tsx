export function RaidLogsSkeleton() {
  return (
    <div className="animate-pulse p-6">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-[120px] bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}
