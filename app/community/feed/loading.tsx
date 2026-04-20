import { SkeletonAvatar, SkeletonLine } from "@/components/Skeleton";

export default function FeedLoading() {
  return (
    <div className="container-app py-6 md:py-10 space-y-4">
      <SkeletonLine className="h-7 w-32" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
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
            <SkeletonLine className="w-3/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
