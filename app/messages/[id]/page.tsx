import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Chat from "./Chat";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: thread } = await supabase
    .from("threads")
    .select("*, jobs(title)")
    .eq("id", id)
    .single();
  if (!thread) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-bold mb-4">{thread.jobs?.title ?? "メッセージ"}</h1>
      <Chat threadId={id} userId={user.id} initial={messages ?? []} />
    </div>
  );
}
