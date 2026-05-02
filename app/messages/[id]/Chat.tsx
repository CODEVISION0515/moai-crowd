"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database";
import { formatTime } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";

type DisplayMessage = Message & {
  /** 楽観的更新の状態（UI 用） */
  _local?: "sending" | "failed";
  /** 楽観的更新時の一時 ID（実 DB 投入後に id で置換される） */
  _tempId?: string;
};

type Counterparty = {
  display_name: string | null;
  avatar_url: string | null;
} | null;

export default function Chat({
  threadId,
  userId,
  initial,
  counterparty,
}: {
  threadId: string;
  userId: string;
  initial: Message[];
  counterparty?: Counterparty;
}) {
  const [messages, setMessages] = useState<DisplayMessage[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // ── リアルタイム購読 + 既読化 ──
  useEffect(() => {
    const sb = createClient();

    /** 自分宛て (sender != self) で未読のメッセージを既読にする */
    async function markRead(messageIds: string[]) {
      if (messageIds.length === 0) return;
      await sb
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", messageIds)
        .neq("sender_id", userId);
    }

    // 初期表示時、相手から届いている未読を一括で既読化
    const unread = initial
      .filter((m) => m.sender_id !== userId && !m.read_at)
      .map((m) => m.id);
    void markRead(unread);

    const channel = sb
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            // 楽観的に追加した自分のメッセージとマージ
            if (incoming.sender_id === userId) {
              const idx = prev.findIndex(
                (m) => m._local === "sending" && m.body === incoming.body,
              );
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = { ...incoming };
                return next;
              }
            }
            // 既に同じ id があるならスキップ（再購読対策）
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          // 相手からの新着を即既読化
          if (incoming.sender_id !== userId) {
            void markRead([incoming.id]);
          }
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, userId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setBody("");

    // 楽観的にローカルへ追加
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: DisplayMessage = {
      id: tempId,
      thread_id: threadId,
      sender_id: userId,
      body: trimmed,
      read_at: null,
      created_at: new Date().toISOString(),
      _local: "sending",
      _tempId: tempId,
    };
    setMessages((prev) => [...prev, optimistic]);

    const sb = createClient();
    const { data, error } = await sb
      .from("messages")
      .insert({ thread_id: threadId, sender_id: userId, body: trimmed })
      .select()
      .single();
    setSending(false);

    if (error || !data) {
      // 失敗 → 該当エントリを「失敗」状態に置換し、入力欄に戻す
      setMessages((prev) =>
        prev.map((m) => (m._tempId === tempId ? { ...m, _local: "failed" } : m)),
      );
      setBody(trimmed);
      toast.error(`送信に失敗しました${error?.message ? `: ${error.message}` : ""}`);
      return;
    }
    // 成功 → realtime INSERT で id 付きの本物が届くが、念のため楽観エントリを置換
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m._tempId === tempId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...(data as Message) };
      return next;
    });
  }

  async function retry(failed: DisplayMessage) {
    if (!failed._tempId) return;
    // 楽観エントリを sending に戻す
    setMessages((prev) =>
      prev.map((m) => (m._tempId === failed._tempId ? { ...m, _local: "sending" as const } : m)),
    );
    const sb = createClient();
    const { data, error } = await sb
      .from("messages")
      .insert({ thread_id: threadId, sender_id: userId, body: failed.body })
      .select()
      .single();
    if (error || !data) {
      setMessages((prev) =>
        prev.map((m) => (m._tempId === failed._tempId ? { ...m, _local: "failed" as const } : m)),
      );
      toast.error("再送信に失敗しました");
      return;
    }
    setMessages((prev) =>
      prev.map((m) => (m._tempId === failed._tempId ? { ...(data as Message) } : m)),
    );
  }

  function discardFailed(failed: DisplayMessage) {
    if (!failed._tempId) return;
    setMessages((prev) => prev.filter((m) => m._tempId !== failed._tempId));
  }

  return (
    <div
      className="
        card p-0 overflow-hidden flex flex-col
        h-[calc(100dvh-var(--header-h)-var(--bottomnav-h)-2rem)]
        md:h-[70vh]
      "
    >
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-slate-50"
        aria-live="polite"
      >
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          const failed = m._local === "failed";
          const sendingState = m._local === "sending";
          return (
            <div
              key={m._tempId ?? m.id}
              className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
            >
              {!mine && (
                <div className="shrink-0 mb-1">
                  <Avatar
                    src={counterparty?.avatar_url ?? null}
                    name={counterparty?.display_name ?? ""}
                    size={28}
                  />
                </div>
              )}
              <div
                className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                  mine
                    ? failed
                      ? "bg-red-50 border border-red-300 text-red-900"
                      : "bg-moai-primary text-white"
                    : "bg-white border border-slate-200"
                } ${sendingState ? "opacity-60" : ""}`}
              >
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div
                  className={`text-[10px] mt-1 flex items-center gap-1.5 ${
                    mine && !failed ? "text-white/70" : failed ? "text-red-700" : "text-slate-400"
                  }`}
                >
                  <span>{formatTime(m.created_at)}</span>
                  {sendingState && <span aria-label="送信中">…</span>}
                  {failed && (
                    <>
                      <span>· 送信失敗</span>
                      <button
                        type="button"
                        onClick={() => retry(m)}
                        className="underline font-medium hover:no-underline"
                      >
                        再送信
                      </button>
                      <button
                        type="button"
                        onClick={() => discardFailed(m)}
                        className="underline hover:no-underline"
                      >
                        破棄
                      </button>
                    </>
                  )}
                  {mine && !failed && !sendingState && m.read_at && <span>· 既読</span>}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">
            最初のメッセージを送信しましょう
          </p>
        )}
      </div>
      <form
        onSubmit={send}
        className="flex gap-2 border-t border-slate-200 p-3 bg-white safe-bottom"
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="input flex-1"
          placeholder="メッセージを入力…"
          aria-label="メッセージ"
          enterKeyHint="send"
          disabled={sending}
        />
        <button
          type="submit"
          className="btn-primary shrink-0"
          disabled={sending || body.trim().length === 0}
          aria-busy={sending}
        >
          {sending ? "…" : "送信"}
        </button>
      </form>
    </div>
  );
}
