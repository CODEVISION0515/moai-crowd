import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "./actions";
import { formatDateJP } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?redirect=/notifications");

  const { data: items } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="container-app max-w-2xl py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">通知</h1>
        <div className="flex items-center gap-2">
          <Link href="/notifications/settings" className="btn-ghost btn-sm">設定</Link>
          <form action={markAllRead}>
            <button className="btn-outline btn-sm">すべて既読</button>
          </form>
        </div>
      </div>
      <div className="space-y-2">
        {items?.map((n: any) => (
          <Link key={n.id} href={n.link ?? "#"}
            className={`card block hover:shadow-md ${n.read_at ? "opacity-60" : ""}`}>
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-semibold">{n.title}</div>
                {n.body && <div className="text-sm text-slate-600 mt-1">{n.body}</div>}
              </div>
              <div className="text-xs text-slate-400 shrink-0">
                {formatDateJP(n.created_at)}
              </div>
            </div>
          </Link>
        ))}
        {(!items || items.length === 0) && (
          <EmptyState icon="🔔" title="通知はまだありません" description="新着のお知らせはここに表示されます" />
        )}
      </div>
    </div>
  );
}
