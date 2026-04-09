import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <SkeletonLine className="w-20 h-8 mb-6" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}
