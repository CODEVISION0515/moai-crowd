import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function ContractLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <SkeletonLine className="w-40 h-4" />
      <SkeletonCard className="mt-4 h-40" />
      <SkeletonCard className="mt-4 h-32" />
    </div>
  );
}
