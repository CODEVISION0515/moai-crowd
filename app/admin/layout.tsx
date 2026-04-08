import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold">🛡 管理画面</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="hover:text-moai-primary">ダッシュボード</Link>
          <Link href="/admin/reports" className="hover:text-moai-primary">通報</Link>
          <Link href="/admin/users" className="hover:text-moai-primary">ユーザー</Link>
          <Link href="/admin/jobs" className="hover:text-moai-primary">案件</Link>
          <Link href="/admin/transactions" className="hover:text-moai-primary">取引</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
