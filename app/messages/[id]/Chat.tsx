"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database";

export default function Chat({
  threadId, userId, initial,
}: { threadId: string; userId: string; initial: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const sb = createClient();

  useEffect(() => {
    const channel = sb
      .channel(`thread:${threadId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [threadId]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const text = body;
    setBody("");
    await sb.from("messages").insert({ thread_id: threadId, sender_id: userId, body: text });
  }

  return (
    <div className="card p-0 overflow-hidden flex flex-col h-[70vh]">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                mine ? "bg-moai-primary text-white" : "bg-white border border-slate-200"
              }`}>
                <div className="whitespace-pre-wrap">{m.body}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-slate-400"}`}>
                  {new Date(m.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">最初のメッセージを送信しましょう</p>
        )}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 bg-white">
        <input value={body} onChange={(e) => setBody(e.target.value)} className="input" placeholder="メッセージを入力..." />
        <button className="btn-primary">送信</button>
      </form>
    </div>
  );
}
