import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function CreditsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <SkeletonLine className="w-32 h-8" />
      <SkeletonCard className="h-24" />
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
