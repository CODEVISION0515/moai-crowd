import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Profile = { handle: string | null; display_name: string | null; avatar_url: string | null };

type ThreadRow = {
  id: string;
  client_id: string;
  worker_id: string;
  last_message_at: string | null;
  jobs: { title: string | null } | null;
  client: Profile | null;
  worker: Profile | null;
};

type LastMessageRow = {
  thread_id: string;
  body: string;
  sender_id: string;
  created_at: string;
};

type UnreadRow = { thread_id: string };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/messages");

  const { data: threads } = await supabase
    .from("threads")
    .select(
      "id, client_id, worker_id, last_message_at, jobs(title), client:client_id(handle, display_name, avatar_url), worker:worker_id(handle, display_name, avatar_url)",
    )
    .or(`client_id.eq.${user.id},worker_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .returns<ThreadRow[]>();

  const threadIds = (threads ?? []).map((t) => t.id);

  // 各スレッドの最終メッセージ + 未読件数 を一括取得
  let lastMessages: LastMessageRow[] = [];
  let unreadCounts = new Map<string, number>();
  if (threadIds.length > 0) {
    const [{ data: msgs }, { data: unread }] = await Promise.all([
      supabase
        .from("messages")
        .select("thread_id, body, sender_id, created_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: false })
        .returns<LastMessageRow[]>(),
      supabase
        .from("messages")
        .select("thread_id")
        .in("thread_id", threadIds)
        .neq("sender_id", user.id)
        .is("read_at", null)
        .returns<UnreadRow[]>(),
    ]);
    // 各スレッドの最初の (=最新) メッセージだけを残す
    const seen = new Set<string>();
    for (const m of msgs ?? []) {
      if (!seen.has(m.thread_id)) {
        lastMessages.push(m);
        seen.add(m.thread_id);
      }
    }
    for (const u of unread ?? []) {
      unreadCounts.set(u.thread_id, (unreadCounts.get(u.thread_id) ?? 0) + 1);
    }
  }
  const lastByThread = new Map(lastMessages.map((m) => [m.thread_id, m] as const));

  return (
    <div className="container-app max-w-3xl py-6 md:py-10 space-y-4">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">メッセージ</h1>
        <p className="mt-1 text-sm text-moai-muted">案件・契約に関するやり取り</p>
      </header>

      {(!threads || threads.length === 0) ? (
        <EmptyState
          icon="💬"
          title="まだメッセージはありません"
          description="案件に応募・契約するとメッセージが届きます"
          action={{ href: "/jobs", label: "案件を探す" }}
        />
      ) : (
        <ul className="card p-0 overflow-hidden divide-y divide-moai-border">
          {threads.map((t) => {
            const isClient = user.id === t.client_id;
            const other = (isClient ? t.worker : t.client) as Profile | null;
            const last = lastByThread.get(t.id);
            const unread = unreadCounts.get(t.id) ?? 0;
            const lastMine = last?.sender_id === user.id;

            return (
              <li key={t.id}>
                <Link
                  href={`/messages/${t.id}`}
                  className={`flex items-center gap-3 p-3 md:p-4 hover:bg-slate-50/60 transition-colors ${
                    unread > 0 ? "bg-moai-primary/[0.03]" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={other?.avatar_url ?? null} name={other?.display_name ?? ""} size={44} />
                    {unread > 0 && (
                      <span
                        className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-moai-primary text-white text-[10px] font-bold ring-2 ring-white"
                        aria-label={`未読 ${unread} 件`}
                      >
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate ${
                          unread > 0 ? "font-bold text-moai-ink" : "font-semibold text-moai-ink"
                        }`}
                      >
                        {other?.display_name ?? "相手"}
                      </span>
                      {t.last_message_at && (
                        <time
                          className="shrink-0 text-[11px] text-moai-muted"
                          dateTime={t.last_message_at}
                        >
                          {formatRelativeTime(t.last_message_at)}
                        </time>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-moai-muted truncate">
                      📄 {t.jobs?.title ?? "(案件情報なし)"}
                    </div>
                    {last && (
                      <div
                        className={`mt-1 text-sm truncate ${
                          unread > 0 ? "text-moai-ink" : "text-moai-muted"
                        }`}
                      >
                        {lastMine && <span className="text-moai-muted">あなた: </span>}
                        {last.body}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
