export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={`bg-gray-800/50 rounded animate-pulse ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-gray-900 rounded-xl p-6 border border-gray-800 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width="40px" height="40px" className="rounded-lg" />
        <div className="flex-1">
          <Skeleton width="60%" height="14px" className="mb-2" />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>
      <Skeleton width="100%" height="10px" className="mb-3" />
      <Skeleton width="100%" height="10px" className="mb-3" />
      <Skeleton width="70%" height="10px" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      <div className="px-6 py-3 bg-gray-800/50">
        <Skeleton width="40%" height="12px" />
      </div>
      <div className="divide-y divide-gray-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <Skeleton width="60%" height="14px" />
            <Skeleton width="80px" height="20px" className="rounded-full" />
            <Skeleton width="100px" height="14px" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`bg-gray-900 rounded-xl p-6 border border-gray-800 ${className}`}>
      <Skeleton width="50%" height="16px" className="mb-4" />
      <Skeleton width="100%" height="200px" className="rounded-lg" />
    </div>
  );
}

export function SkeletonStats({ count = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${count} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton width="20px" height="20px" className="rounded" />
            <Skeleton width="80px" height="12px" />
          </div>
          <Skeleton width="60px" height="28px" />
        </div>
      ))}
    </div>
  );
}