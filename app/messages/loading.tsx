import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function MessagesLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SkeletonLine className="w-32 h-8 mb-6" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
