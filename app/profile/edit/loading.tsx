import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function ProfileEditLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <SkeletonLine className="w-48 h-8" />
      <div className="skeleton h-24 rounded-2xl" />
      <SkeletonCard className="h-60" />
      <SkeletonCard className="h-40" />
    </div>
  );
}
