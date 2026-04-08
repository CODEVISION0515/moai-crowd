import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function markAllRead() {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await sb.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id).is("read_at", null);
  revalidatePath("/notifications");
}

export default async function NotificationsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: items } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">通知</h1>
        <form action={markAllRead}>
          <button className="btn-outline">すべて既読</button>
        </form>
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
                {new Date(n.created_at).toLocaleString("ja-JP")}
              </div>
            </div>
          </Link>
        ))}
        {(!items || items.length === 0) && (
          <p className="text-center text-slate-500 py-10">通知はまだありません</p>
        )}
      </div>
    </div>
  );
}
