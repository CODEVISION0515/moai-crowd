import { requireAdmin } from "@/lib/auth";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4 flex-wrap gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span aria-hidden="true">🛡</span>管理画面
        </h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
