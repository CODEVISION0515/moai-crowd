/** 再利用可能なスケルトンUIパーツ */

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-4 w-full ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`card space-y-3 ${className}`}>
      <SkeletonLine className="w-1/3" />
      <SkeletonLine />
      <SkeletonLine className="w-2/3" />
    </div>
  );
}

export function SkeletonAvatar({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-12 w-12 rounded-full ${className}`} />;
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
