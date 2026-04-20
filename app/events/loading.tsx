import { SkeletonLine } from "@/components/Skeleton";

export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-7 w-32" />
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card">
            <div className="flex gap-4">
              <div className="shrink-0 space-y-2">
                <SkeletonLine className="h-3 w-10" />
                <div className="skeleton h-8 w-8 rounded" />
                <SkeletonLine className="h-3 w-10" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="h-5 w-3/4" />
                <SkeletonLine className="w-full" />
                <SkeletonLine className="w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
