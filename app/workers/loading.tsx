import { SkeletonAvatar, SkeletonLine } from "@/components/Skeleton";

export default function WorkersLoading() {
  return (
    <div className="container-app py-6 md:py-10 space-y-6">
      <SkeletonLine className="h-7 w-40" />
      <div className="skeleton h-12 rounded-xl" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonAvatar />
              <div className="flex-1 space-y-2">
                <SkeletonLine className="h-4 w-28" />
                <SkeletonLine className="h-3 w-20" />
              </div>
            </div>
            <SkeletonLine className="w-full" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-14 rounded" />
              <div className="skeleton h-5 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
