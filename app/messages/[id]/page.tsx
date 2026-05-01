import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import Chat from "./Chat";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/messages/${id}`);

  const { data: thread } = await supabase
    .from("threads")
    .select(
      "id, client_id, worker_id, jobs(id, title), client:client_id(handle, display_name, avatar_url), worker:worker_id(handle, display_name, avatar_url)",
    )
    .eq("id", id)
    .single();
  if (!thread) notFound();
  if (thread.client_id !== user.id && thread.worker_id !== user.id) notFound();

  const counterparty = (user.id === thread.client_id ? thread.worker : thread.client) as unknown as
    | { handle: string | null; display_name: string | null; avatar_url: string | null }
    | null;

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  const job = (thread as unknown as { jobs: { id: string; title: string | null } | null }).jobs;

  return (
    <div className="container-app max-w-2xl py-4 md:py-6 space-y-3">
      {/* スレッドヘッダー */}
      <header className="flex items-center gap-3">
        <Link
          href="/messages"
          aria-label="メッセージ一覧に戻る"
          className="text-moai-muted hover:text-moai-primary text-sm shrink-0"
        >
          ←
        </Link>
        <Avatar src={counterparty?.avatar_url ?? null} name={counterparty?.display_name ?? ""} size={36} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">
            {counterparty?.handle ? (
              <Link href={`/profile/${counterparty.handle}`} className="hover:underline">
                {counterparty.display_name ?? counterparty.handle}
              </Link>
            ) : (
              counterparty?.display_name ?? "相手"
            )}
          </div>
          {job && (
            <div className="text-xs text-moai-muted truncate">
              {job.id ? (
                <Link href={`/jobs/${job.id}`} className="hover:text-moai-primary hover:underline">
                  📄 {job.title ?? "(案件)"}
                </Link>
              ) : (
                <>📄 {job.title ?? "(案件)"}</>
              )}
            </div>
          )}
        </div>
      </header>

      <Chat
        threadId={id}
        userId={user.id}
        initial={messages ?? []}
        counterparty={
          counterparty
            ? { display_name: counterparty.display_name, avatar_url: counterparty.avatar_url }
            : null
        }
      />
    </div>
  );
}
