import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <SkeletonLine className="w-32 h-8" />
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>
      <div className="card mb-6 space-y-3">
        <div className="skeleton h-10 rounded-xl" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
