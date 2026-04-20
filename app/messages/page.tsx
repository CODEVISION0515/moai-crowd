import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateJP } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: threads } = await supabase
    .from("threads")
    .select("id, last_message_at, jobs(title), client:client_id(display_name, handle), worker:worker_id(display_name, handle)")
    .or(`client_id.eq.${user.id},worker_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">メッセージ</h1>
      <div className="space-y-2">
        {threads?.map((t: any) => {
          const other = t.client?.handle === t.worker?.handle
            ? t.client : (user.id === t.client_id ? t.worker : t.client);
          return (
            <Link key={t.id} href={`/messages/${t.id}`} className="card block hover:shadow-md transition">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{other?.display_name ?? "相手"}</div>
                  <div className="text-xs text-slate-500">{t.jobs?.title ?? "(案件情報なし)"}</div>
                </div>
                <div className="text-xs text-slate-400">
                  {formatDateJP(t.last_message_at)}
                </div>
              </div>
            </Link>
          );
        })}
        {(!threads || threads.length === 0) && (
          <EmptyState
            icon="💬"
            title="まだメッセージはありません"
            description="案件に応募・契約するとメッセージが届きます"
            action={{ href: "/jobs", label: "案件を探す" }}
          />
        )}
      </div>
    </div>
  );
}
