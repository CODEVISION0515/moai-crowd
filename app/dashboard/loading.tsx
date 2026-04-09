import { SkeletonCard, SkeletonLine } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="container-app py-6 md:py-10 space-y-6">
      <div className="card-flat bg-slate-100 h-40 skeleton rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-16 rounded-2xl" />
        ))}
      </div>
      <SkeletonLine className="w-40" />
      <div className="grid md:grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
