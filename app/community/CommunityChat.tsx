"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import { formatRelativeTime } from "@/lib/utils";

type Sender = {
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
} | null;

type Msg = {
  id: string;
  sender_id: string;
  body: string;
  reply_to_id: string | null;
  created_at: string;
  sender: Sender;
  /** 楽観的更新中の状態 */
  _local?: "sending" | "failed";
  /** 楽観 → 実 ID 置換用 */
  _tempId?: string;
};

const MAX_BODY = 2000;

export default function CommunityChat({
  userId,
  initial,
}: {
  userId: string | null;
  initial: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Realtime subscription ──
  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel("community_chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        async (payload) => {
          const incoming = payload.new as {
            id: string;
            sender_id: string;
            body: string;
            reply_to_id: string | null;
            created_at: string;
          };
          // 自分の楽観メッセージとマージ
          if (userId && incoming.sender_id === userId) {
            const idx = messages.findIndex(
              (m) => m._local === "sending" && m.body === incoming.body,
            );
            if (idx !== -1) {
              setMessages((prev) => {
                const next = [...prev];
                next[idx] = { ...next[idx], ...incoming, _local: undefined, _tempId: undefined };
                return next;
              });
              return;
            }
          }
          // 既出 ID はスキップ
          if (messages.some((m) => m.id === incoming.id)) return;

          // sender 情報を取得
          const { data: senderRow } = await sb
            .from("profiles")
            .select("handle, display_name, avatar_url")
            .eq("id", incoming.sender_id)
            .maybeSingle();
          const senderInfo = senderRow as Sender;

          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id)
              ? prev
              : [...prev, { ...incoming, sender: senderInfo }],
          );
        },
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // 自動スクロール
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      toast.error("ログインすると投稿できます");
      return;
    }
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > MAX_BODY) {
      toast.error(`${MAX_BODY} 文字以内で入力してください`);
      return;
    }
    setSending(true);
    setBody("");
    const replyId = replyTo?.id ?? null;
    setReplyTo(null);

    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: Msg = {
      id: tempId,
      sender_id: userId,
      body: trimmed,
      reply_to_id: replyId,
      created_at: new Date().toISOString(),
      sender: null, // 自分なので left に出ないため空でも問題ない
      _local: "sending",
      _tempId: tempId,
    };
    setMessages((prev) => [...prev, optimistic]);

    const sb = createClient();
    const { data, error } = await sb
      .from("community_messages")
      .insert({ sender_id: userId, body: trimmed, reply_to_id: replyId })
      .select("id, sender_id, body, reply_to_id, created_at")
      .single();
    setSending(false);

    if (error || !data) {
      setMessages((prev) =>
        prev.map((m) => (m._tempId === tempId ? { ...m, _local: "failed" } : m)),
      );
      setBody(trimmed);
      toast.error(`送信に失敗しました${error?.message ? `: ${error.message}` : ""}`);
      return;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m._tempId === tempId ? { ...m, ...data, _local: undefined, _tempId: undefined } : m,
      ),
    );
  }

  function retry(failed: Msg) {
    if (!failed._tempId || !userId) return;
    setMessages((prev) => prev.filter((m) => m._tempId !== failed._tempId));
    setBody(failed.body);
    setReplyTo(failed.reply_to_id ? messages.find((m) => m.id === failed.reply_to_id) ?? null : null);
  }

  function discard(failed: Msg) {
    if (!failed._tempId) return;
    setMessages((prev) => prev.filter((m) => m._tempId !== failed._tempId));
  }

  // 返信元メッセージ参照
  function findReplyTarget(id: string | null): Msg | undefined {
    if (!id) return undefined;
    return messages.find((m) => m.id === id);
  }

  return (
    <div
      className="
        card p-0 overflow-hidden flex flex-col
        h-[calc(100dvh-var(--header-h)-var(--bottomnav-h)-12rem)]
        md:h-[68vh]
      "
    >
      {/* メッセージリスト */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-3 bg-slate-50"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">
            まだメッセージがありません。最初のひと言をどうぞ 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = userId !== null && m.sender_id === userId;
          const failed = m._local === "failed";
          const sendingState = m._local === "sending";
          const replyTarget = findReplyTarget(m.reply_to_id);
          return (
            <div
              key={m._tempId ?? m.id}
              id={`msg-${m.id}`}
              className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
            >
              {!mine && (
                <Link
                  href={m.sender?.handle ? `/profile/${m.sender.handle}` : "#"}
                  className="shrink-0 mb-1"
                  aria-label={m.sender?.display_name ?? "ユーザー"}
                >
                  <Avatar
                    src={m.sender?.avatar_url ?? null}
                    name={m.sender?.display_name ?? ""}
                    size={32}
                  />
                </Link>
              )}
              <div
                className={`max-w-[78%] sm:max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}
              >
                {!mine && m.sender && (
                  <div className="text-[11px] text-moai-muted mb-0.5 px-1">
                    {m.sender.handle ? (
                      <Link href={`/profile/${m.sender.handle}`} className="hover:underline">
                        {m.sender.display_name ?? m.sender.handle}
                      </Link>
                    ) : (
                      m.sender.display_name ?? "—"
                    )}
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    mine
                      ? failed
                        ? "bg-red-50 border border-red-300 text-red-900"
                        : "bg-moai-primary text-white"
                      : "bg-white border border-slate-200"
                  } ${sendingState ? "opacity-60" : ""}`}
                >
                  {/* 返信元プレビュー */}
                  {replyTarget && (
                    <div
                      className={`mb-1.5 -mx-1 px-2 py-1 rounded text-[11px] border-l-2 ${
                        mine
                          ? "border-white/50 bg-white/10"
                          : "border-moai-primary/40 bg-moai-cloud/60 text-moai-muted"
                      }`}
                    >
                      <span className="font-semibold">
                        {replyTarget.sender?.display_name ?? "ユーザー"}
                      </span>
                      <span className="ml-1 line-clamp-1 inline">{replyTarget.body}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                </div>
                <div
                  className={`text-[10px] mt-1 px-1 flex items-center gap-2 ${
                    failed ? "text-red-700" : "text-moai-muted"
                  }`}
                >
                  <time dateTime={m.created_at}>{formatRelativeTime(m.created_at)}</time>
                  {sendingState && <span aria-label="送信中">送信中…</span>}
                  {failed && (
                    <>
                      <span>送信失敗</span>
                      <button
                        type="button"
                        onClick={() => retry(m)}
                        className="underline font-medium hover:no-underline"
                      >
                        再送
                      </button>
                      <button
                        type="button"
                        onClick={() => discard(m)}
                        className="underline hover:no-underline"
                      >
                        破棄
                      </button>
                    </>
                  )}
                  {!mine && !failed && !sendingState && userId && (
                    <button
                      type="button"
                      onClick={() => setReplyTo(m)}
                      className="hover:text-moai-primary"
                      aria-label="このメッセージに返信"
                    >
                      返信
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      {userId ? (
        <form
          onSubmit={send}
          className="border-t border-slate-200 p-2.5 bg-white safe-bottom"
        >
          {replyTo && (
            <div className="mb-2 flex items-start justify-between gap-2 rounded-md border border-moai-border bg-moai-cloud/60 px-2.5 py-1.5 text-xs">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-moai-muted">
                  ↳ {replyTo.sender?.display_name ?? "ユーザー"} に返信
                </div>
                <div className="line-clamp-1 text-moai-ink mt-0.5">{replyTo.body}</div>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="shrink-0 text-moai-muted hover:text-red-600"
                aria-label="返信をキャンセル"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="input flex-1"
              placeholder="メッセージを入力…"
              aria-label="メッセージ"
              enterKeyHint="send"
              disabled={sending}
              maxLength={MAX_BODY}
            />
            <button
              type="submit"
              className="btn-primary shrink-0"
              disabled={sending || body.trim().length === 0}
              aria-busy={sending}
            >
              {sending ? "…" : "送信"}
            </button>
          </div>
          <div className="mt-1 px-1 flex justify-end">
            <span className={`text-[10px] tabular-nums ${body.length > MAX_BODY * 0.9 ? "text-red-600" : "text-moai-muted"}`}>
              {body.length} / {MAX_BODY}
            </span>
          </div>
        </form>
      ) : (
        <div className="border-t border-slate-200 p-3 bg-white text-center text-sm">
          <Link href="/login?redirect=/community" className="text-moai-primary hover:underline font-medium">
            ログインしてゆんたくに参加
          </Link>
        </div>
      )}
    </div>
  );
}
