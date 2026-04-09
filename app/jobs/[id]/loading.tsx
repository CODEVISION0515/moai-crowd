import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function JobDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <SkeletonLine className="w-24 h-4" />
      <SkeletonCard className="mt-4 h-60" />
      <SkeletonCard className="mt-6 h-40" />
    </div>
  );
}
