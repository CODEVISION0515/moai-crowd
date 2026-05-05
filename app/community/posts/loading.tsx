import { SkeletonAvatar, SkeletonLine } from "@/components/Skeleton";

export default function CommunityLoading() {
  return (
    <div className="container-app py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-7 w-40" />
        <div className="skeleton h-10 w-28 rounded-lg" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonAvatar className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <SkeletonLine className="h-4 w-32" />
                <SkeletonLine className="h-3 w-20" />
              </div>
            </div>
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
